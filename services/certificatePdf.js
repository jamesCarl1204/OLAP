import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';
import { UPLOAD_DIR } from '../config/uploads.js';

const ASSETS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const asset = (f) => { const p = path.join(ASSETS, f); return fs.existsSync(p) ? p : null; };

const ord = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const title = (s) => String(s ?? '').toLowerCase().replace(/(^|[\s.-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
const joinList = (a) => (a.length < 2 ? a.join('') : a.length === 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')}, and ${a.at(-1)}`);
const dayOf = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  return `${ord(x.getDate())} day of ${x.toLocaleDateString('en-PH', { month: 'long' })}, ${x.getFullYear()}`;
};
const longDate = (d) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

export async function buildBaptismPdf(snapshot, issued) {
  const q = snapshot.request;
  const r = snapshot.record ?? {};
  const key = `certificates/${issued.certificate_no || q.reference_no}.pdf`;
  await fs.promises.mkdir(path.join(UPLOAD_DIR, 'certificates'), { recursive: true });

  const doc = new PDFDocument({ size: 'A4', margin: 56 });
  const out = fs.createWriteStream(path.join(UPLOAD_DIR, key));
  doc.pipe(out);

  const L = 56, W = doc.page.width - 112, V = 168; // left, content width, value column x

  const mid = (t, font = 'Times-Roman', size = 12) =>
    doc.font(font).fontSize(size).text(t, L, doc.y, { width: W, align: 'center' }).moveDown(0.5);

  const row = (label, value) => {
    const y = doc.y;
    doc.font('Times-Roman').fontSize(12).text(label, L, y, { width: V - L - 8 });
    doc.font('Times-Bold').text(value, V, y, { width: L + W - V });
    doc.moveDown(0.6);
  };

  const mixed = (parts) => {
    parts.forEach(([t, bold], i) => {
      doc.font(bold ? 'Times-Bold' : 'Times-Roman').fontSize(12);
      const last = i === parts.length - 1;
      if (i === 0) doc.text(t, L, doc.y, { continued: !last });
      else doc.text(t, { continued: !last });
    });
  };

  // ---- header ----
  const logo = asset('parish-logo.png');
  if (logo) doc.image(logo, L - 10, 40, { height: 72 });
  doc.font('Helvetica-Bold').fontSize(26).text('Our Lady of the Airways Parish', L, 52, { width: W, align: 'center' });
  doc.font('Helvetica').fontSize(9.5).text(
    'Chapel Rd. cor. Ninoy Aquino Avenue, Pasay City\nEmail: airways_parish@yahoo.com\nTelephone: (02) 8851-4371\nMobile Nos. 0956-3647788/0919-4639797',
    L, doc.y + 2, { width: W, align: 'center', lineGap: 2 });

  // ---- title + name ----
  doc.moveDown(2);
  mid('CERTIFICATE OF BAPTISM', 'Times-Bold', 19);
  mid('This is to certify that');
  mid((r.full_name || q.subject_name || '').toUpperCase(), 'Times-Bold', 28);
  doc.moveDown(0.5);

  // ---- body ----
  row('Child of', title(r.father_name || q.father_name) || '—');
  row('And', title(r.mother_name || q.mother_name) || '—');
  row('born in', title(r.birth_place || q.birth_place) || '—');
  row('on the', dayOf(r.birth_date || q.birth_date));
  mid('was solemnly Baptized');
  row('on the', dayOf(r.event_date || q.event_date));
  mid('ACCORDING TO THE RITE OF THE\nROMAN CATHOLIC CHURCH');
  row('By the Rev.', title(r.officiant) || '—');

  // sponsors can be an array or a "A;B;C" string from the DB
  const list = Array.isArray(r.sponsors)
    ? r.sponsors
    : String(r.sponsors || '').split(';').map((s) => s.trim()).filter(Boolean);
  const sponsors = list.length ? joinList(list.map(title)) : '—';
  const y = doc.y;
  doc.font('Times-Roman').text('the sponsors being:', L, y, { width: V - L + 20 });
  doc.text(sponsors, V + 20, y, { width: L + W - V - 20 });

  // ---- register line ----
  doc.moveDown(4);
  doc.font('Times-Roman').fontSize(12).text('as appears on the Baptismal Register of this Church.', L, doc.y);
  doc.moveDown(0.5);
  mixed([
    ['BK. No.: '], [`${r.book_no || '—'}`, true], ['     Page No.: '], [`${r.page_no || '—'}`, true],
    ['     Line No.: '], [`${r.line_no || '—'}`, true], ['     Date: '], [longDate(issued.issued_at), true],
  ]);
  doc.moveDown(0.5);
  mixed([['Purpose: '], [`FOR ${String(q.purpose || '').toUpperCase()}`, true]]);

  // ---- signature ----
  const sy = Math.max(doc.y + 30, 640);
  const sig = asset('signature.png');
  if (sig) doc.image(sig, 330, sy - 40, { width: 170 });
  doc.font('Times-Bold').fontSize(13).text(String(issued.signed_by || '').replace(/^REV\.\s*/i, 'Rev. '), 300, sy + 10, { width: W - 244 + 56, align: 'center' });
  doc.font('Times-Roman').fontSize(12).text('Parish Priest', 300, doc.y, { width: W - 244 + 56, align: 'center' });

  doc.end();
  await new Promise((res, rej) => { out.on('finish', res); out.on('error', rej); });
  return { storage_key: key };
}

const BUILDERS = { baptismal: buildBaptismPdf /* confirmation, no_record_* next */ };

export async function attachPdf(requestId) {
  const [[i]] = await pool.query(
    'SELECT * FROM issued_certificates WHERE request_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1', [requestId]);
  if (!i) return;
  const snap = typeof i.data_snapshot === 'string' ? JSON.parse(i.data_snapshot) : i.data_snapshot;
  const build = BUILDERS[snap.request.certificate_type];
  if (!build) return;
  const { storage_key } = await build(snap, i);
  await pool.query('UPDATE issued_certificates SET pdf_storage_key = ? WHERE id = ?', [storage_key, i.id]);
}