import crypto from 'node:crypto';
import { pool } from '../config/db.js';
import { nextReference, REF_CODES } from '../utils/reference.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (message, status = 400) => new HttpError(status, message);

const FINAL = ['released', 'sent', 'rejected'];
const LABEL = {
  baptismal: 'Baptismal', confirmation: 'Confirmation', marriage: 'Marriage',
  no_record_baptism: 'No Record (Baptism)', no_record_confirmation: 'No Record (Confirmation)',
};
const REGISTRY_TYPE = { baptismal: 'baptism', confirmation: 'confirmation' };
const NO_RECORD_TYPE = { no_record_baptism: 'baptism', no_record_confirmation: 'confirmation' };
const SIGN = '\n\nGod bless,\nParish Office\nOur Lady of the Airways Parish';

// ---- helpers ----
async function log(c, id, userId, type, from, to, note) {
  await c.query(
    'INSERT INTO request_events (request_id, actor_user_id, type, from_status, to_status, note) VALUES (?,?,?,?,?,?)',
    [id, userId, type, from, to, note]);
}

async function move(c, r, to, userId, note) {
  await c.query(
    `UPDATE certificate_requests SET status = ?, closed_at = ${FINAL.includes(to) ? 'NOW()' : 'NULL'} WHERE id = ?`,
    [to, r.id]);
  await log(c, r.id, userId, 'status_changed', r.status, to, note);
  r.status = to;
}

async function queue(c, r, key, subject, body, issuedId = null) {
  await c.query(
    `INSERT INTO email_outbox (request_id, issued_certificate_id, to_email, template_key, subject, body)
     VALUES (?,?,?,?,?,?)`,
    [r.id, issuedId, r.contact_email, key, subject.slice(0, 255), body]);
}

const who = (r) => r.requester_name || 'Requester';
const need = (ok, message) => { if (!ok) throw bad(message, 409); };

function reasonOf(b) {
  const v = String(b.reason ?? '').trim();
  if (v.length < 3) throw bad('Enter a reason.');
  if (v.length > 500) throw bad('The reason is too long (500 characters max).');
  return v;
}

function mailOf(b) {
  const subject = String(b.subject ?? '').trim();
  const body = String(b.body ?? '').trim();
  if (!subject || !body) throw bad('The email is empty.');
  if (subject.length > 255 || body.length > 10000) throw bad('The email is too long.');
  return { subject, body };
}

async function issuedOf(c, requestId) {
  const [[i]] = await c.query(
    'SELECT * FROM issued_certificates WHERE request_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1', [requestId]);
  return i || null;
}

// ---- actions ----
const ACTIONS = {
  async start(c, r, _b, u) {
    need(r.status === 'submitted', 'This request was already started.');
    const to = r.pay_method === 'gcash' ? 'payment_check' : 'record_check';
    await move(c, r, to, u, to === 'payment_check' ? 'Payment check started.' : 'Record check started.');
  },

  async hold(c, r, b, u) {
    need(r.status !== 'on_hold', 'This request is already on hold.');
    const why = reasonOf(b);
    await move(c, r, 'on_hold', u, `On hold: ${why}`);
    await queue(c, r, 'on_hold', `Your request ${r.reference_no} is on hold`,
      `Dear ${who(r)},\n\nYour ${LABEL[r.certificate_type]} certificate request (${r.reference_no}) has been put on hold.\n\nReason: ${why}\n\nPlease contact the parish office.${SIGN}`);
  },

  async resume(c, r, _b, u) {
    need(r.status === 'on_hold', 'Only requests on hold can be resumed.');
    const unpaid = r.pay_method === 'gcash' && r.pay_status !== 'verified';
    await move(c, r, unpaid ? 'payment_check' : 'record_check', u, 'Request resumed.');
  },

  async reject(c, r, b, u) {
    const why = reasonOf(b);
    await c.query('UPDATE certificate_requests SET reject_reason = ? WHERE id = ?', [why, r.id]);
    await move(c, r, 'rejected', u, `Rejected: ${why}`);
    await queue(c, r, 'rejected', `Your request ${r.reference_no} could not be processed`,
      `Dear ${who(r)},\n\nYour ${LABEL[r.certificate_type]} certificate request (${r.reference_no}) could not be processed.\n\nReason: ${why}\n\nPlease contact the parish office.${SIGN}`);
  },

  async 'verify-payment'(c, r, _b, u) {
    need(r.status === 'payment_check' && r.pay_method === 'gcash', 'Payment can only be verified during the payment check of a GCash request.');
    await c.query(
      `UPDATE payments SET status = 'verified', verified_by = ?, verified_at = NOW(), reject_reason = NULL WHERE id = ?`,
      [u, r.pay_id]);
    await log(c, r.id, u, 'payment_verified', null, null, 'Payment verified.');
    await move(c, r, 'record_check', u, 'Payment verified. Record check started.');
  },

  async 'reject-payment'(c, r, b, u) {
    need(r.status === 'payment_check' && r.pay_method === 'gcash', 'Payment can only be rejected during the payment check.');
    const why = reasonOf(b);
    await c.query(`UPDATE payments SET status = 'rejected', reject_reason = ? WHERE id = ?`, [why, r.pay_id]);
    await log(c, r.id, u, 'payment_rejected', null, null, `Payment rejected: ${why}`);
    await move(c, r, 'on_hold', u, 'On hold: payment rejected.');
    await queue(c, r, 'payment_rejected', `Payment problem with request ${r.reference_no}`,
      `Dear ${who(r)},\n\nWe could not verify the payment for your ${LABEL[r.certificate_type]} certificate request (${r.reference_no}).\n\nReason: ${why}\n\nPlease contact the parish office.${SIGN}`);
  },

  async 'confirm-record'(c, r, b, u) {
    need(r.status === 'record_check', 'The request is not in record check.');
    const type = REGISTRY_TYPE[r.certificate_type];
    if (!type) throw bad('Use "No record found" for No Record certificates.');
    const [[g]] = await c.query('SELECT id FROM registry_records WHERE id = ? AND record_type = ?', [Number(b.registry_record_id), type]);
    if (!g) throw bad('Record not found.', 404);
    await c.query(
      `UPDATE certificate_requests SET record_result = 'found', registry_record_id = ?, record_checked_by = ?, record_checked_at = NOW() WHERE id = ?`,
      [g.id, u, r.id]);
    await move(c, r, 'ready', u, 'Record found and linked. Ready to generate.');
  },

  async 'no-record'(c, r, _b, u) {
    need(r.status === 'record_check', 'The request is not in record check.');
    if (NO_RECORD_TYPE[r.certificate_type]) throw bad('Use "No record found" for No Record certificates.');
    const why = 'No matching record was found in the parish registry.';
    await c.query(`UPDATE certificate_requests SET record_result = 'not_found', record_checked_by = ?, record_checked_at = NOW() WHERE id = ?`, [u, r.id]);
    await move(c, r, 'on_hold', u, `On hold: ${why}`);
    await queue(c, r, 'on_hold', `Your request ${r.reference_no} is on hold`,
      `Dear ${who(r)},\n\nWe could not find a matching record for your ${LABEL[r.certificate_type]} certificate request (${r.reference_no}). Please contact the parish office with more details (parents' names, date of the sacrament).${SIGN}`);
  },

  async 'confirm-no-record'(c, r, _b, u) {
    need(r.status === 'record_check', 'The request is not in record check.');
    const type = NO_RECORD_TYPE[r.certificate_type];
    if (!type) throw bad('This is not a No Record request.');
    const [[hit]] = await c.query('SELECT id FROM registry_records WHERE record_type = ? AND full_name = ? LIMIT 1', [type, r.subject_name]);
    if (hit) throw bad('A record with this exact name exists in the registry. Do not issue a No Record certificate; put the request on hold instead.', 409);
    await c.query(`UPDATE certificate_requests SET record_result = 'not_found', record_checked_by = ?, record_checked_at = NOW() WHERE id = ?`, [u, r.id]);
    await move(c, r, 'ready', u, 'No record found. Ready to generate.');
  },

  async generate(c, r, b, u) {
    need(r.status === 'ready', 'The certificate can only be generated when the request is ready.');
    need(['verified', 'paid_on_pickup'].includes(r.pay_status), 'The payment is not verified.');
    need(!(await issuedOf(c, r.id)), 'The certificate was already generated.');

    let signedBy = String(b.signed_by ?? '').trim().slice(0, 255);
    if (!signedBy) {
      const [[s]] = await c.query("SELECT `value` FROM settings WHERE `key` = 'parish_priest'");
      signedBy = s?.value || '';
    }
    if (!signedBy) throw bad('Enter who signs the certificate.');

    const digital = r.format === 'digital';
    const certificateNo = digital ? await nextReference(c, REF_CODES.certificate) : null;
    const token = digital ? crypto.randomBytes(24).toString('hex') : null;
    const [[record]] = r.registry_record_id
      ? await c.query('SELECT * FROM registry_records WHERE id = ?', [r.registry_record_id])
      : [[]];

    const snapshot = {
      request: {
        reference_no: r.reference_no, certificate_type: r.certificate_type, format: r.format,
        subject_name: r.subject_name, father_name: r.father_name, mother_name: r.mother_name,
        birth_date: r.birth_date, birth_place: r.birth_place, event_date: r.event_date, purpose: r.purpose,
        destination_church: r.destination_church, destination_city: r.destination_city,
      },
      record: record ?? null,
    };
    await c.query(
      `INSERT INTO issued_certificates (request_id, certificate_no, verify_token, data_snapshot, signed_by, issued_by)
       VALUES (?,?,?,?,?,?)`,
      [r.id, certificateNo, token, JSON.stringify(snapshot), signedBy, u]);
    await log(c, r.id, u, 'issued', null, null, digital ? `E-certificate ${certificateNo} generated.` : 'Certificate generated for printing.');
  },

  async 'send-email'(c, r, b, u) {
    need(r.format === 'digital', 'Only digital certificates are sent by email.');
    need(['ready', 'sent'].includes(r.status), 'The request is not ready to send.');
    const iss = await issuedOf(c, r.id);
    need(iss, 'Generate the certificate first.');
    const mail = mailOf(b);
    await queue(c, r, 'digital_certificate', mail.subject, mail.body, iss.id);
    await log(c, r.id, u, 'email_sent', null, null, `Certificate email queued to ${r.contact_email}.`);
    if (r.status === 'ready') await move(c, r, 'sent', u, 'E-certificate sent to the requester.');
  },

  async 'notify-pickup'(c, r, b, u) {
    need(r.format === 'hardcopy' && r.status === 'ready', 'Only hardcopy requests that are ready can be notified for pickup.');
    need(await issuedOf(c, r.id), 'Generate the certificate first.');
    const mail = mailOf(b);
    await queue(c, r, 'ready_for_pickup', mail.subject, mail.body);
    await log(c, r.id, u, 'email_sent', null, null, `Pickup email queued to ${r.contact_email}.`);
  },

  async release(c, r, b, u) {
    need(r.format === 'hardcopy' && r.status === 'ready', 'Only a ready hardcopy can be released.');
    need(await issuedOf(c, r.id), 'Generate the certificate first.');
    const claimedBy = String(b.claimed_by ?? '').trim();
    if (!claimedBy || claimedBy.length > 255) throw bad('Enter the name of the person who claimed the certificate.');
    await c.query('UPDATE certificate_requests SET claimed_by_name = ?, claimed_at = NOW() WHERE id = ?', [claimedBy, r.id]);
    await move(c, r, 'released', u, `Released to ${claimedBy}.`);
  },
};

export async function runAction(id, name, body, userId) {
  const fn = Object.hasOwn(ACTIONS, name) ? ACTIONS[name] : null;
  if (!fn) throw new HttpError(404, 'Unknown action.');

  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [[r]] = await c.query(
      `SELECT r.*, p.id AS pay_id, p.method AS pay_method, p.status AS pay_status
       FROM certificate_requests r LEFT JOIN payments p ON p.request_id = r.id
       WHERE r.id = ? FOR UPDATE`, [id]);
    if (!r) throw new HttpError(404, 'Request not found.');
    if (FINAL.includes(r.status) && !(name === 'send-email' && r.status === 'sent'))
      throw new HttpError(409, 'This request is closed.');
    await fn(c, r, body, userId);
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
