import { pool } from '../config/db.js';
import { PROOF_DIR } from '../config/uploads.js';
import { runAction, HttpError } from '../services/certificateWorkflow.js';

const toRecord = (g) => ({
  id: g.id,
  full_name: g.full_name,
  father_name: g.father_name,
  mother_name: g.mother_name,
  birth_date: g.birth_date,
  birth_place: g.birth_place,
  event_date: g.event_date,
  officiant: g.officiant,
  sponsors: g.sponsors ? g.sponsors.split(';').map((s) => s.trim()).filter(Boolean) : [],
  book_no: g.book_no,
  page_no: g.page_no,
  line_no: g.line_no,
});

const toRequest = (r) => ({
  id: r.id,
  reference_no: r.reference_no,
  certificate_type: r.certificate_type,
  format: r.format,
  status: r.status,
  subject_name: r.subject_name,
  father_name: r.father_name,
  mother_name: r.mother_name,
  birth_date: r.birth_date,
  birth_place: r.birth_place,
  event_date: r.event_date,
  purpose: r.purpose,
  destination_church: r.destination_church,
  destination_city: r.destination_city,
  requester_name: r.requester_name,
  contact_email: r.contact_email,
  contact_phone: r.contact_phone,
  fee_amount: Number(r.fee_amount),
  submitted_at: r.submitted_at,
  consent_at: r.consent_at,
  duplicates: Number(r.dupes),
  payment: {
    method: r.pay_method,
    status: r.pay_status,
    sender_gcash_number: r.sender_gcash_number,
    sender_account_name: r.sender_account_name,
    reject_reason: r.pay_reject_reason,
    proof: r.proof_id ? {
      type: r.mime_type?.startsWith('image/') ? 'image' : 'pdf',
      url: `/api/staff/files/${r.proof_id}`,
      name: r.original_name,
      size_kb: Math.max(1, Math.round(r.size_bytes / 1024)),
      uploaded_at: r.proof_uploaded_at,
      duplicate: Number(r.proof_dupes) > 0,
    } : null,
  },
});

export async function listRequests(_req, res) {
  const [rows] = await pool.query(
    `SELECT r.*, p.method AS pay_method, p.status AS pay_status,
            p.sender_gcash_number, p.sender_account_name, p.reject_reason AS pay_reject_reason,
            f.id AS proof_id, f.original_name, f.mime_type, f.size_bytes, f.uploaded_at AS proof_uploaded_at,
            (SELECT COUNT(*) FROM files f2 WHERE f2.sha256 = f.sha256 AND f2.id <> f.id) AS proof_dupes,
            (SELECT COUNT(*) FROM certificate_requests x
              WHERE x.id <> r.id AND x.certificate_type = r.certificate_type
                AND x.subject_name = r.subject_name AND x.contact_email = r.contact_email
                AND x.status <> 'rejected') AS dupes
     FROM certificate_requests r
     LEFT JOIN payments p ON p.request_id = r.id
     LEFT JOIN files f ON f.id = p.proof_file_id
     ORDER BY r.submitted_at DESC`);

  const [evts] = await pool.query(
    `SELECT e.request_id, e.note, e.created_at, u.full_name
     FROM request_events e LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.request_id IS NOT NULL ORDER BY e.created_at, e.id`);
  const events = {};
  for (const e of evts) (events[e.request_id] ||= []).push({ note: e.note, actor: e.full_name || 'Requester', at: e.created_at });

  const [iss] = await pool.query('SELECT * FROM issued_certificates WHERE revoked_at IS NULL ORDER BY id');
  const issued = {};
  for (const i of iss) issued[i.request_id] = {
    certificate_no: i.certificate_no, verify_token: i.verify_token, signed_by: i.signed_by, issued_at: i.issued_at,
  };

  const [recs] = await pool.query(
    `SELECT r.id AS request_id, g.* FROM certificate_requests r
     JOIN registry_records g ON g.id = r.registry_record_id`);
  const records = {};
  for (const g of recs) records[g.request_id] = toRecord(g);

  const [mails] = await pool.query(
    `SELECT o.id, o.request_id, c.reference_no, o.to_email, o.template_key, o.subject,
            o.status, o.attempts, o.last_error, o.queued_at
     FROM email_outbox o JOIN certificate_requests c ON c.id = o.request_id
     ORDER BY o.queued_at DESC, o.id DESC`);

  res.json({ requests: rows.map(toRequest), events, issued, records, emails: mails });
}

export async function searchRegistry(req, res) {
  const type = req.query.type;
  if (!['baptism', 'confirmation'].includes(type)) return res.json({ records: [] });
  const q = String(req.query.q ?? '').trim().slice(0, 100).replace(/[\\%_]/g, '\\$&');
  const [rows] = await pool.query(
    'SELECT * FROM registry_records WHERE record_type = ? AND full_name LIKE ? ORDER BY full_name LIMIT 20',
    [type, `%${q}%`]);
  res.json({ records: rows.map(toRecord) });
}

export async function act(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid request.' });
  try {
    await runAction(id, req.params.action, req.body || {}, req.auth.sub);
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ message: e.message });
    throw e;
  }
}

export async function getFile(req, res) {
  const [[f]] = await pool.query(
    'SELECT storage_key, mime_type, original_name FROM files WHERE id = ? LIMIT 1', [Number(req.params.id)]);
  if (!f) return res.status(404).json({ message: 'File not found.' });
  res.type(f.mime_type);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'private, no-store');
  res.sendFile(f.storage_key, { root: PROOF_DIR }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ message: 'File not found.' });
  });
}


const ymd = (d) => {
  if (!(d instanceof Date)) return d ?? null;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const MARRIAGE_LABEL = { catholic: 'Catholic', non_catholic: 'Non-Catholic', civil: 'Civil' };
const DOC_KEY = { birth_certificate: 'birth', marriage_contract: 'marriage', no_record: 'noRecord' };

export async function listBaptisms(_req, res) {
  const [rows] = await pool.query(
    `SELECT b.*, t.code AS type_code,
            p.method AS pay_method, p.status AS pay_status, p.sender_gcash_number, p.sender_account_name,
            p.reject_reason AS pay_reject_reason,
            f.id AS proof_id, f.original_name AS proof_name, f.mime_type AS proof_mime,
            f.size_bytes AS proof_size, f.uploaded_at AS proof_uploaded_at
     FROM baptism_registrations b
     JOIN baptism_types t ON t.id = b.baptism_type_id
     LEFT JOIN payments p ON p.baptism_id = b.id
     LEFT JOIN files f ON f.id = p.proof_file_id
     ORDER BY b.submitted_at DESC`);

  const [spons] = await pool.query('SELECT baptism_id, full_name, address FROM baptism_sponsors ORDER BY baptism_id, position');
  const sponsorsOf = {};
  for (const s of spons) (sponsorsOf[s.baptism_id] ||= []).push({ name: s.full_name, address: s.address });

  const [docs] = await pool.query(
    `SELECT d.baptism_id, d.doc_type, f.id AS file_id, f.original_name
     FROM baptism_documents d JOIN files f ON f.id = d.file_id`);
  const filesOf = {};
  for (const d of docs) (filesOf[d.baptism_id] ||= []).push({
    key: DOC_KEY[d.doc_type], name: d.original_name, url: `/api/staff/files/${d.file_id}`,
  });

  const [evts] = await pool.query(
    `SELECT e.baptism_id, e.note, e.created_at, u.full_name
     FROM request_events e LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.baptism_id IS NOT NULL ORDER BY e.created_at, e.id`);
  const events = {};
  for (const e of evts) (events[`b${e.baptism_id}`] ||= []).push({ note: e.note, actor: e.full_name || 'Requester', at: e.created_at });

  const baptisms = rows.map((r) => ({
    id: r.id,
    reference_no: r.reference_no,
    type_id: r.type_code,
    status: r.status,
    date: ymd(r.requested_date),
    time: r.requested_time,
    confirmed_date: ymd(r.confirmed_date) || ymd(r.requested_date),
    confirmed_time: r.confirmed_time || r.requested_time,
    child: { given: r.child_given, middle: r.child_middle, surname: r.child_surname, dob: ymd(r.child_birth_date), pob: r.child_birth_place },
    father: { name: r.father_name, pob: r.father_birth_place },
    mother: { name: r.mother_name, pob: r.mother_birth_place },
    marriage_kind: MARRIAGE_LABEL[r.marriage_kind],
    venue: r.marriage_venue,
    address: r.parents_address,
    email: r.contact_email,
    phone: r.contact_phone,
    married_legally: !!r.married_legally,
    late_birth_reg: !!r.late_birth_reg,
    parent_name: r.parent_print_name,
    sponsors: sponsorsOf[r.id] || [],
    files: filesOf[r.id] || [],
    fee_total: Number(r.fee_total),
    reject_reason: r.reject_reason,
    submitted_at: r.submitted_at,
    payment: {
      method: r.pay_method,
      status: r.pay_status,
      sender_gcash_number: r.sender_gcash_number,
      sender_account_name: r.sender_account_name,
      reject_reason: r.pay_reject_reason,
      proof: r.proof_id ? {
        type: r.proof_mime?.startsWith('image/') ? 'image' : 'pdf',
        url: `/api/staff/files/${r.proof_id}`,
        name: r.proof_name,
        size_kb: Math.max(1, Math.round(r.proof_size / 1024)),
        uploaded_at: r.proof_uploaded_at,
      } : null,
    },
    staff: {
      priest: r.baptized_by, received_by: r.received_by_name,
      book: r.book_no, page: r.page_no, line: r.line_no, stipend: r.stipend_received,
    },
  }));

  res.json({ baptisms, events });
}

// Staff UI uses these payment labels for Mass Intentions.
const massPayStatus = (method, status) => {
  if (status === 'verified') return 'paid';
  if (status === 'rejected') return 'rejected';
  return method === 'gcash' ? 'for_verification' : 'pending_payment';
};

export async function listMasses(_req, res) {
  const [rows] = await pool.query(
    `SELECT m.*, t.code AS type_code,
            p.method AS pay_method, p.status AS pay_status, p.gcash_reference_no,
            p.reject_reason AS pay_reject_reason,
            f.id AS proof_id, f.original_name AS proof_name, f.mime_type AS proof_mime,
            f.size_bytes AS proof_size, f.uploaded_at AS proof_uploaded_at
     FROM mass_intentions m
     JOIN mass_intention_types t ON t.id = m.mass_type_id
     LEFT JOIN payments p ON p.mass_id = m.id
     LEFT JOIN files f ON f.id = p.proof_file_id
     ORDER BY m.submitted_at DESC`);

  const [evts] = await pool.query(
    `SELECT e.mass_id, e.note, e.created_at, u.full_name
     FROM request_events e LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.mass_id IS NOT NULL ORDER BY e.created_at, e.id`);
  const events = {};
  for (const e of evts) (events[`m${e.mass_id}`] ||= []).push({ note: e.note, actor: e.full_name || 'Requester', at: e.created_at });

  const masses = rows.map((r) => ({
    id: r.id,
    reference_no: r.reference_no,
    type_id: r.type_code,
    status: r.status,
    requestor: r.requestor_name,
    phone: r.contact_phone,
    email: r.contact_email,
    prayed_for: r.prayed_for,
    special: r.special_requests,
    date: ymd(r.requested_date),
    time: r.requested_time,
    confirmed_date: ymd(r.confirmed_date) || ymd(r.requested_date),
    confirmed_time: r.confirmed_time || r.requested_time,
    reject_reason: r.reject_reason,
    submitted_at: r.submitted_at,
    payment: {
      method: r.pay_method,
      status: massPayStatus(r.pay_method, r.pay_status),
      gcash_ref: r.gcash_reference_no,
      reject_reason: r.pay_reject_reason,
      proof: r.proof_id ? {
        type: r.proof_mime?.startsWith('image/') ? 'image' : 'pdf',
        url: `/api/staff/files/${r.proof_id}`,
        name: r.proof_name,
        size_kb: Math.max(1, Math.round(r.proof_size / 1024)),
        uploaded_at: r.proof_uploaded_at,
      } : null,
    },
  }));

  res.json({ masses, events });
}
