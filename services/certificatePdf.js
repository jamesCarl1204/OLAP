import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const A = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const SERIF = path.join(A, 'fonts', 'Caladea-Regular.ttf');
const SERIF_B = path.join(A, 'fonts', 'Caladea-Bold.ttf');

const ord = (n) => { const s = ['th','st','nd','rd'], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };
const fmtLong = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const joinList = (a) => a.length < 2 ? a.join('') : a.length === 2 ? a.join(' and ') : `${a.slice(0, -1).join(', ')}, and ${a.at(-1)}`;

// "on the 18th day of April, 2006" with a small superscript ordinal
function dayLine(doc, y, date) {
  const d = new Date(date);
  const n = String(d.getDate());
  const rest = `${d.toLocaleDateString('en-US', { month: 'long' })}, ${d.getFullYear()}`;
  doc.font(SERIF).fontSize(12).text('on', 72, y).text('the', 108, y);
  doc.font(SERIF_B).text(n, 160, y);
  const w = doc.widthOfString(n);
  doc.fontSize(7).text(ord(d.getDate()), 160 + w + 1, y - 2);
  doc.font(SERIF).fontSize(12).text('day', 300, y).text('of', 345, y);
  doc.font(SERIF_B).text(rest, 385, y);
}

export function buildBaptismPdf({ record: r, issued, purpose }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 0 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // letterhead
    doc.image(path.join(A, 'logo.png'), 60, 40, { width: 60 });
    doc.font('Helvetica-Bold').fontSize(28).text('Our Lady of the Airways Parish', 0, 48, { align: 'center', width: 612 });
    doc.font(SERIF).fontSize(10).text(
      'Chapel Rd. cor. Ninoy Aquino Avenue, Pasay City\nEmail: airways_parish@yahoo.com\nTelephone: (02) 8851-4371\nMobile Nos. 0956-3647788/0919-4639797',
      0, 84, { align: 'center', width: 612 });

    doc.font(SERIF_B).fontSize(20).text('CERTIFICATE OF BAPTISM', 0, 170, { align: 'center', width: 612 });
    doc.font(SERIF).fontSize(12).text('This is to certify that', 0, 205, { align: 'center', width: 612 });
    doc.font(SERIF_B).fontSize(28).text(r.full_name, 0, 225, { align: 'center', width: 612 });

    const row = (y, label, val) => {
      doc.font(SERIF).fontSize(12).text(label, 72, y);
      doc.font(SERIF_B).text(val || '—', 160, y);
    };
    row(275, 'Child of', r.father_name);
    row(300, 'And', r.mother_name);
    row(325, 'born in', r.birth_place);
    dayLine(doc, 350, r.birth_date);
    doc.font(SERIF).fontSize(12).text('was solemnly Baptized', 0, 380, { align: 'center', width: 612 });
    dayLine(doc, 405, r.event_date);
    doc.font(SERIF).fontSize(11).text('ACCORDING TO THE RITE OF THE\nROMAN CATHOLIC CHURCH', 0, 435, { align: 'center', width: 612, lineGap: 6 });
    row(480, 'By the Rev.', r.officiant);
    doc.font(SERIF).fontSize(12).text('the sponsors being:', 72, 510);
    doc.text(joinList(r.sponsors || []), 190, 510, { width: 340 });
    doc.text('as appears on the Baptismal Register of this Church.', 72, 590);

    doc.text('BK. No.:', 72, 615).font(SERIF_B).text(r.book_no, 120, 615);
    doc.font(SERIF).text('Page No.:', 175, 615).font(SERIF_B).text(r.page_no, 230, 615);
    doc.font(SERIF).text('Line No.:', 290, 615).font(SERIF_B).text(r.line_no, 345, 615);
    doc.font(SERIF).text('Date:', 400, 615).font(SERIF_B).text(fmtLong(issued.issued_at), 435, 615);
    doc.font(SERIF).text('Purpose:', 72, 640).font(SERIF_B).text(`FOR ${String(purpose).toUpperCase()}`, 160, 640);

    // signature + name
    doc.image(path.join(A, 'signature-valencia.png'), 330, 690, { width: 190 });
    doc.font(SERIF_B).fontSize(13).text(issued.signed_by, 300, 745, { width: 250, align: 'center' });
    doc.font(SERIF).fontSize(13).text('Parish Priest', 300, 762, { width: 250, align: 'center' });

    doc.end();
  });
}