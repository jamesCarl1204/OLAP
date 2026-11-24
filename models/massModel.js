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