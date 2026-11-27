import { pool } from '../config/db.js';
import { nextReference } from '../utils/reference.js';

export async function findActiveType(code) {
  const [[t]] = await pool.query('SELECT * FROM baptism_types WHERE code = ? AND is_active = 1 LIMIT 1', [code]);
  return t || null;
}

async function insertFile(c, f) {
  const [r] = await c.query(
    'INSERT INTO files (storage_key, original_name, mime_type, size_bytes, sha256) VALUES (?,?,?,?,?)',
    [f.storage_key, f.original_name, f.mime_type, f.size_bytes, f.sha256]);
  return r.insertId;
}

// Registration + sponsors + documents + payment + first activity entry, all in ONE transaction.
// Returns the reference number. Everything is rolled back on any error.
export async function createBaptismRegistration({ type, code, data, sponsors, docs, proof, payment, fee, consentVersion }) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const referenceNo = await nextReference(c, code);

    const cols = {
      reference_no: referenceNo, baptism_type_id: type.id,
      requested_date: data.date, requested_time: data.time,
      child_surname: data.surname, child_given: data.given, child_middle: data.middle,
      child_birth_date: data.dob, child_birth_place: data.pob,
      father_name: data.father, father_birth_place: data.fatherPob,
      mother_name: data.mother, mother_birth_place: data.motherPob,
      marriage_kind: data.marriageKind, marriage_venue: data.venue, parents_address: data.address,
      married_legally: data.marriedLegally ? 1 : 0, late_birth_reg: data.lateBirthReg ? 1 : 0,
      contact_email: data.email, contact_phone: data.phone, parent_print_name: data.parentName,
      fee_base: fee.base, fee_stipend: fee.stipend, fee_extra_sponsors: fee.extra, fee_total: fee.total,
      consent_version: consentVersion,
    };
    const keys = Object.keys(cols);
    const [r] = await c.query(
      `INSERT INTO baptism_registrations (${keys.join(', ')}, consent_at)
       VALUES (${keys.map(() => '?').join(', ')}, NOW())`,
      Object.values(cols));
    const id = r.insertId;

    for (let i = 0; i < sponsors.length; i++) {
      await c.query(
        'INSERT INTO baptism_sponsors (baptism_id, position, full_name, address) VALUES (?,?,?,?)',
        [id, i + 1, sponsors[i].full_name, sponsors[i].address]);
    }

    for (const d of docs) {
      const fileId = await insertFile(c, d.file);
      await c.query('INSERT INTO baptism_documents (baptism_id, doc_type, file_id) VALUES (?,?,?)', [id, d.doc_type, fileId]);
    }

    const proofId = proof ? await insertFile(c, proof) : null;
    await c.query(
      `INSERT INTO payments (baptism_id, method, amount, status, sender_gcash_number, sender_account_name, proof_file_id)
       VALUES (?,?,?,?,?,?,?)`,
      [id, payment.method, fee.total, payment.method === 'pickup' ? 'paid_on_pickup' : 'pending',
       payment.sender_number, payment.sender_name, proofId]);

    await c.query(
      "INSERT INTO request_events (baptism_id, type, to_status, note) VALUES (?, 'submitted', 'pending', 'Registration submitted online.')",
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

export async function listBaptismRows() {
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
  return rows;
}

export async function listSponsorRows() {
  const [rows] = await pool.query('SELECT baptism_id, full_name, address FROM baptism_sponsors ORDER BY baptism_id, position');
  return rows;
}

export async function listDocumentRows() {
  const [rows] = await pool.query(
    `SELECT d.baptism_id, d.doc_type, f.id AS file_id, f.original_name
     FROM baptism_documents d JOIN files f ON f.id = d.file_id`);
  return rows;
}

export async function listBaptismEvents() {
  const [rows] = await pool.query(
    `SELECT e.baptism_id AS ref_id, e.note, e.created_at, u.full_name
     FROM request_events e LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.baptism_id IS NOT NULL ORDER BY e.created_at, e.id`);
  return rows;
}