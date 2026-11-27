import { pool } from '../config/db.js';
import { nextReference } from '../utils/reference.js';

// Creates the request, its payment, the proof file record, and the first activity entry in ONE transaction.
// Returns the new reference number. Throws on any DB error (everything is rolled back).
export async function createCertificateRequest({ type, code, person, contact, payment, file, consentVersion }) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const referenceNo = await nextReference(c, code);

    const [r] = await c.query(
      `INSERT INTO certificate_requests
        (reference_no, certificate_type, format, subject_name, father_name, mother_name,
         birth_date, birth_place, event_date, purpose, destination_church, destination_city,
         requester_name, contact_email, contact_phone, fee_amount, consent_at, consent_version)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)`,
      [referenceNo, type, contact.format, person.subject_name, person.father_name, person.mother_name,
       person.birth_date, person.birth_place, person.event_date, person.purpose,
       person.destination_church ?? null, person.destination_city ?? null,
       person.requester_name ?? person.subject_name, contact.email, contact.phone, person.fee, consentVersion]);

    let fileId = null;
    if (file) {
      const [f] = await c.query(
        'INSERT INTO files (storage_key, original_name, mime_type, size_bytes, sha256) VALUES (?,?,?,?,?)',
        [file.storage_key, file.original_name, file.mime_type, file.size_bytes, file.sha256]);
      fileId = f.insertId;
    }

    await c.query(
      `INSERT INTO payments (request_id, method, amount, status, sender_gcash_number, sender_account_name, proof_file_id)
       VALUES (?,?,?,?,?,?,?)`,
      [r.insertId, payment.method, person.fee, payment.method === 'pickup' ? 'paid_on_pickup' : 'pending',
       payment.sender_number, payment.sender_name, fileId]);

    await c.query(
      "INSERT INTO request_events (request_id, type, to_status, note) VALUES (?, 'submitted', 'submitted', 'Request submitted online.')",
      [r.insertId]);

    await c.commit();
    return referenceNo;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

export async function listRequestRows() {
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
  return rows;
}

export async function listRequestEvents() {
  const [rows] = await pool.query(
    `SELECT e.request_id AS ref_id, e.note, e.created_at, u.full_name
     FROM request_events e LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.request_id IS NOT NULL ORDER BY e.created_at, e.id`);
  return rows;
}

export async function listIssuedRows() {
  const [rows] = await pool.query('SELECT * FROM issued_certificates WHERE revoked_at IS NULL ORDER BY id');
  return rows;
}

export async function listLinkedRecords() {
  const [rows] = await pool.query(
    `SELECT r.id AS request_id, g.* FROM certificate_requests r
     JOIN registry_records g ON g.id = r.registry_record_id`);
  return rows;
}

export async function listEmailRows() {
  const [rows] = await pool.query(
    `SELECT o.id, o.request_id, c.reference_no, o.to_email, o.template_key, o.subject,
            o.status, o.attempts, o.last_error, o.queued_at
     FROM email_outbox o JOIN certificate_requests c ON c.id = o.request_id
     ORDER BY o.queued_at DESC, o.id DESC`);
  return rows;
}