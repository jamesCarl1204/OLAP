import { pool } from '../config/db.js';
import { nextReference } from '../utils/reference.js';

export async function findActiveType(code) {
  const [[t]] = await pool.query('SELECT * FROM mass_intention_types WHERE code = ? AND is_active = 1 LIMIT 1', [code]);
  return t || null;
}

// Intention + payment + proof file record + first activity entry, all in ONE transaction.
// Returns the reference number. Everything is rolled back on any error.
export async function createMassIntention({ type, code, data, proof, payment, consentVersion }) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const referenceNo = await nextReference(c, code);

    const [r] = await c.query(
      `INSERT INTO mass_intentions
        (reference_no, mass_type_id, requestor_name, contact_phone, contact_email, prayed_for,
         special_requests, requested_date, requested_time, consent_at, consent_version)
       VALUES (?,?,?,?,?,?,?,?,?,NOW(),?)`,
      [referenceNo, type.id, data.requestor, data.phone, data.email, data.prayedFor,
       data.special, data.date, data.time, consentVersion]);
    const id = r.insertId;

    let proofId = null;
    if (proof) {
      const [f] = await c.query(
        'INSERT INTO files (storage_key, original_name, mime_type, size_bytes, sha256) VALUES (?,?,?,?,?)',
        [proof.storage_key, proof.original_name, proof.mime_type, proof.size_bytes, proof.sha256]);
      proofId = f.insertId;
    }

    // amount stays NULL: the parish sets the offering amount.
    await c.query(
      `INSERT INTO payments (mass_id, method, amount, status, gcash_reference_no, proof_file_id)
       VALUES (?,?,NULL,'pending',?,?)`,
      [id, payment.method, payment.gcash_ref, proofId]);

    await c.query(
      "INSERT INTO request_events (mass_id, type, to_status, note) VALUES (?, 'submitted', 'pending', 'Mass Intention submitted online.')",
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

export async function listMassRows() {
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
  return rows;
}

export async function listMassEvents() {
  const [rows] = await pool.query(
    `SELECT e.mass_id AS ref_id, e.note, e.created_at, u.full_name
     FROM request_events e LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.mass_id IS NOT NULL ORDER BY e.created_at, e.id`);
  return rows;
}