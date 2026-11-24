import { pool } from '../config/db.js';
import { nextReference } from '../utils/reference.js';

// True if an approved booking already uses this date and time.
export async function isSlotTaken(date, time) {
  const [[r]] = await pool.query(
    "SELECT COUNT(*) AS n FROM marriage_bookings WHERE status = 'approved' AND COALESCE(confirmed_date, requested_date) = ? AND COALESCE(confirmed_time, requested_time) = ?",
    [date, time]);
  return r.n > 0;
}

async function insertFile(c, f) {
  const [r] = await c.query(
    'INSERT INTO files (storage_key, original_name, mime_type, size_bytes, sha256) VALUES (?,?,?,?,?)',
    [f.storage_key, f.original_name, f.mime_type, f.size_bytes, f.sha256]);
  return r.insertId;
}

export async function createMarriageBooking({ code, type, data, docs, proof, payment, fee, consentVersion }) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const referenceNo = await nextReference(c, code);

    const [r] = await c.query(
      `INSERT INTO marriage_bookings
        (reference_no, marriage_type, requested_date, requested_time,
         groom_name, groom_birth_date, groom_birth_place, bride_name, bride_birth_date, bride_birth_place,
         address, contact_name, contact_email, contact_phone, fee_total, consent_at, consent_version)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)`,
      [referenceNo, type, data.date, data.time,
       data.groomName, data.groomDob, data.groomPob, data.brideName, data.brideDob, data.bridePob,
       data.address, data.contactName, data.email, data.phone, fee, consentVersion]);
    const id = r.insertId;

    for (const d of docs) {
      const fileId = await insertFile(c, d.file);
      await c.query('INSERT INTO marriage_documents (marriage_id, doc_type, file_id) VALUES (?,?,?)', [id, d.doc_type, fileId]);
    }

    const proofId = proof ? await insertFile(c, proof) : null;
    await c.query(
      `INSERT INTO payments (marriage_id, method, amount, status, sender_gcash_number, sender_account_name, proof_file_id)
       VALUES (?,?,?,?,?,?,?)`,
      [id, payment.method, fee, payment.method === 'pickup' ? 'paid_on_pickup' : 'pending',
       payment.sender_number, payment.sender_name, proofId]);

    await c.query(
      "INSERT INTO request_events (marriage_id, type, to_status, note) VALUES (?, 'submitted', 'pending', 'Marriage booking submitted online.')",
      [id]);

    await c.commit();
    return referenceNo;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

// Staff list: bookings + payment + proof, documents, and activity.
export async function listBookings() {
  const [rows] = await pool.query(
    `SELECT m.*, p.method AS pay_method, p.status AS pay_status,
            p.sender_gcash_number, p.sender_account_name, p.reject_reason AS pay_reject_reason,
            f.id AS proof_id, f.original_name AS proof_name, f.mime_type AS proof_mime,
            f.size_bytes AS proof_size, f.uploaded_at AS proof_uploaded_at
     FROM marriage_bookings m
     LEFT JOIN payments p ON p.marriage_id = m.id
     LEFT JOIN files f ON f.id = p.proof_file_id
     ORDER BY m.submitted_at DESC`);

  const [docs] = await pool.query(
    `SELECT d.marriage_id, d.doc_type, f.id AS file_id, f.original_name
     FROM marriage_documents d JOIN files f ON f.id = d.file_id`);

  const [events] = await pool.query(
    `SELECT e.marriage_id, e.note, e.created_at, u.full_name
     FROM request_events e LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.marriage_id IS NOT NULL ORDER BY e.created_at, e.id`);

  return { rows, docs, events };
}