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