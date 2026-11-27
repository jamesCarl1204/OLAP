import { pool } from '../config/db.js';

export const getConnection = () => pool.getConnection();

export async function lockRequest(c, id) {
  const [[r]] = await c.query(
    `SELECT r.*, p.id AS pay_id, p.method AS pay_method, p.status AS pay_status
     FROM certificate_requests r LEFT JOIN payments p ON p.request_id = r.id
     WHERE r.id = ? FOR UPDATE`, [id]);
  return r || null;
}

export const logEvent = (c, id, userId, type, from, to, note) =>
  c.query(
    'INSERT INTO request_events (request_id, actor_user_id, type, from_status, to_status, note) VALUES (?,?,?,?,?,?)',
    [id, userId, type, from, to, note]);

export const setStatus = (c, id, to, closed) =>
  c.query(`UPDATE certificate_requests SET status = ?, closed_at = ${closed ? 'NOW()' : 'NULL'} WHERE id = ?`, [to, id]);

export const queueEmail = (c, { requestId, issuedId, toEmail, key, subject, body }) =>
  c.query(
    `INSERT INTO email_outbox (request_id, issued_certificate_id, to_email, template_key, subject, body)
     VALUES (?,?,?,?,?,?)`,
    [requestId, issuedId, toEmail, key, subject, body]);

export async function findIssued(c, requestId) {
  const [[i]] = await c.query(
    'SELECT * FROM issued_certificates WHERE request_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1', [requestId]);
  return i || null;
}

export const setRejectReason = (c, id, why) =>
  c.query('UPDATE certificate_requests SET reject_reason = ? WHERE id = ?', [why, id]);

export const markPaymentVerified = (c, payId, userId) =>
  c.query(`UPDATE payments SET status = 'verified', verified_by = ?, verified_at = NOW(), reject_reason = NULL WHERE id = ?`, [userId, payId]);

export const markPaymentRejected = (c, payId, why) =>
  c.query(`UPDATE payments SET status = 'rejected', reject_reason = ? WHERE id = ?`, [why, payId]);

export async function findRegistryRecord(c, id, type) {
  const [[g]] = await c.query('SELECT id FROM registry_records WHERE id = ? AND record_type = ?', [id, type]);
  return g || null;
}

export async function getRegistryRecord(c, id) {
  const [[g]] = await c.query('SELECT * FROM registry_records WHERE id = ?', [id]);
  return g || null;
}

export async function registryNameExists(c, type, fullName) {
  const [[hit]] = await c.query('SELECT id FROM registry_records WHERE record_type = ? AND full_name = ? LIMIT 1', [type, fullName]);
  return !!hit;
}

export const markRecordFound = (c, requestId, registryId, userId) =>
  c.query(`UPDATE certificate_requests SET record_result = 'found', registry_record_id = ?, record_checked_by = ?, record_checked_at = NOW() WHERE id = ?`,
    [registryId, userId, requestId]);

export const markRecordNotFound = (c, requestId, userId) =>
  c.query(`UPDATE certificate_requests SET record_result = 'not_found', record_checked_by = ?, record_checked_at = NOW() WHERE id = ?`,
    [userId, requestId]);

export async function getSetting(c, key) {
  const [[s]] = await c.query('SELECT `value` FROM settings WHERE `key` = ?', [key]);
  return s?.value || '';
}

export const insertIssued = (c, { requestId, certificateNo, token, snapshot, signedBy, userId }) =>
  c.query(
    `INSERT INTO issued_certificates (request_id, certificate_no, verify_token, data_snapshot, signed_by, issued_by)
     VALUES (?,?,?,?,?,?)`,
    [requestId, certificateNo, token, JSON.stringify(snapshot), signedBy, userId]);

export async function insertFile(c, f) {
  const [r] = await c.query(
    'INSERT INTO files (storage_key, original_name, mime_type, size_bytes, sha256) VALUES (?,?,?,?,?)',
    [f.storage_key, f.original_name, f.mime_type, f.size_bytes, f.sha256]);
  return r.insertId;
}

export const setIssuedPdf = (c, requestId, fileId) =>
  c.query('UPDATE issued_certificates SET pdf_file_id = ? WHERE request_id = ? AND revoked_at IS NULL', [fileId, requestId]);

export const setClaimed = (c, id, name) =>
  c.query('UPDATE certificate_requests SET claimed_by_name = ?, claimed_at = NOW() WHERE id = ?', [name, id]);