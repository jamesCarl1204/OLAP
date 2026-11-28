import crypto from 'node:crypto';
import * as M from '../models/certificateModel.js';
import { nextReference, REF_CODES } from '../utils/reference.js';
import { attachPdf } from './certificatePdf.js';

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

// ---- helpers (rules only, no SQL) ----
async function move(c, r, to, userId, note) {
  await M.setStatus(c, r.id, to, FINAL.includes(to));
  await M.logEvent(c, r.id, userId, 'status_changed', r.status, to, note);
  r.status = to;
}

const queue = (c, r, key, subject, body, issuedId = null) =>
  M.queueEmail(c, { requestId: r.id, issuedId, toEmail: r.contact_email, key, subject: subject.slice(0, 255), body });

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
    await M.setRejectReason(c, r.id, why);
    await move(c, r, 'rejected', u, `Rejected: ${why}`);
    await queue(c, r, 'rejected', `Your request ${r.reference_no} could not be processed`,
      `Dear ${who(r)},\n\nYour ${LABEL[r.certificate_type]} certificate request (${r.reference_no}) could not be processed.\n\nReason: ${why}\n\nPlease contact the parish office.${SIGN}`);
  },

  async 'verify-payment'(c, r, _b, u) {
    need(r.status === 'payment_check' && r.pay_method === 'gcash', 'Payment can only be verified during the payment check of a GCash request.');
    await M.markPaymentVerified(c, r.pay_id, u);
    await M.logEvent(c, r.id, u, 'payment_verified', null, null, 'Payment verified.');
    await move(c, r, 'record_check', u, 'Payment verified. Record check started.');
  },

  async 'reject-payment'(c, r, b, u) {
    need(r.status === 'payment_check' && r.pay_method === 'gcash', 'Payment can only be rejected during the payment check.');
    const why = reasonOf(b);
    await M.markPaymentRejected(c, r.pay_id, why);
    await M.logEvent(c, r.id, u, 'payment_rejected', null, null, `Payment rejected: ${why}`);
    await move(c, r, 'on_hold', u, 'On hold: payment rejected.');
    await queue(c, r, 'payment_rejected', `Payment problem with request ${r.reference_no}`,
      `Dear ${who(r)},\n\nWe could not verify the payment for your ${LABEL[r.certificate_type]} certificate request (${r.reference_no}).\n\nReason: ${why}\n\nPlease contact the parish office.${SIGN}`);
  },

  async 'confirm-record'(c, r, b, u) {
    need(r.status === 'record_check', 'The request is not in record check.');
    const type = REGISTRY_TYPE[r.certificate_type];
    if (!type) throw bad('Use "No record found" for No Record certificates.');
    const g = await M.findRegistryRecord(c, Number(b.registry_record_id), type);
    if (!g) throw bad('Record not found.', 404);
    await M.markRecordFound(c, r.id, g.id, u);
    await move(c, r, 'ready', u, 'Record found and linked. Ready to generate.');
  },

  async 'no-record'(c, r, _b, u) {
    need(r.status === 'record_check', 'The request is not in record check.');
    if (NO_RECORD_TYPE[r.certificate_type]) throw bad('Use "No record found" for No Record certificates.');
    const why = 'No matching record was found in the parish registry.';
    await M.markRecordNotFound(c, r.id, u);
    await move(c, r, 'on_hold', u, `On hold: ${why}`);
    await queue(c, r, 'on_hold', `Your request ${r.reference_no} is on hold`,
      `Dear ${who(r)},\n\nWe could not find a matching record for your ${LABEL[r.certificate_type]} certificate request (${r.reference_no}). Please contact the parish office with more details (parents' names, date of the sacrament).${SIGN}`);
  },

  async 'confirm-no-record'(c, r, _b, u) {
    need(r.status === 'record_check', 'The request is not in record check.');
    const type = NO_RECORD_TYPE[r.certificate_type];
    if (!type) throw bad('This is not a No Record request.');
    if (await M.registryNameExists(c, type, r.subject_name))
      throw bad('A record with this exact name exists in the registry. Do not issue a No Record certificate; put the request on hold instead.', 409);
    await M.markRecordNotFound(c, r.id, u);
    await move(c, r, 'ready', u, 'No record found. Ready to generate.');
  },

  // Saves the issued certificate + snapshot. The PDF is built by attachPdf() after the commit (see runAction).
  async generate(c, r, b, u) {
    need(r.status === 'ready', 'The certificate can only be generated when the request is ready.');
    need(['verified', 'paid_on_pickup'].includes(r.pay_status), 'The payment is not verified.');
    need(!(await M.findIssued(c, r.id)), 'The certificate was already generated.');

    let signedBy = String(b.signed_by ?? '').trim().slice(0, 255);
    if (!signedBy) signedBy = await M.getSetting(c, 'parish_priest');
    if (!signedBy) throw bad('Enter who signs the certificate.');

    const digital = r.format === 'digital';
    const certificateNo = digital ? await nextReference(c, REF_CODES.certificate) : null;
    const token = digital ? crypto.randomBytes(24).toString('hex') : null;
    const record = r.registry_record_id ? await M.getRegistryRecord(c, r.registry_record_id) : null;

    const snapshot = {
      request: {
        reference_no: r.reference_no, certificate_type: r.certificate_type, format: r.format,
        subject_name: r.subject_name, father_name: r.father_name, mother_name: r.mother_name,
        birth_date: r.birth_date, birth_place: r.birth_place, event_date: r.event_date, purpose: r.purpose,
        destination_church: r.destination_church, destination_city: r.destination_city,
      },
      record,
    };
    await M.insertIssued(c, { requestId: r.id, certificateNo, token, snapshot, signedBy, userId: u });
    await M.logEvent(c, r.id, u, 'issued', null, null, digital ? `E-certificate ${certificateNo} generated.` : 'Certificate generated for printing.');
  },

  async 'send-email'(c, r, b, u) {
    need(r.format === 'digital', 'Only digital certificates are sent by email.');
    need(['ready', 'sent'].includes(r.status), 'The request is not ready to send.');
    const iss = await M.findIssued(c, r.id);
    need(iss, 'Generate the certificate first.');
    const mail = mailOf(b);
    await queue(c, r, 'digital_certificate', mail.subject, mail.body, iss.id);
    await M.logEvent(c, r.id, u, 'email_sent', null, null, `Certificate email queued to ${r.contact_email}.`);
    if (r.status === 'ready') await move(c, r, 'sent', u, 'E-certificate sent to the requester.');
  },

  async 'notify-pickup'(c, r, b, u) {
    need(r.format === 'hardcopy' && r.status === 'ready', 'Only hardcopy requests that are ready can be notified for pickup.');
    need(await M.findIssued(c, r.id), 'Generate the certificate first.');
    const mail = mailOf(b);
    await queue(c, r, 'ready_for_pickup', mail.subject, mail.body);
    await M.logEvent(c, r.id, u, 'email_sent', null, null, `Pickup email queued to ${r.contact_email}.`);
  },

  async release(c, r, b, u) {
    need(r.format === 'hardcopy' && r.status === 'ready', 'Only a ready hardcopy can be released.');
    need(await M.findIssued(c, r.id), 'Generate the certificate first.');
    const claimedBy = String(b.claimed_by ?? '').trim();
    if (!claimedBy || claimedBy.length > 255) throw bad('Enter the name of the person who claimed the certificate.');
    await M.setClaimed(c, r.id, claimedBy);
    await move(c, r, 'released', u, `Released to ${claimedBy}.`);
  },
};

export async function runAction(id, name, body, userId) {
  const fn = Object.hasOwn(ACTIONS, name) ? ACTIONS[name] : null;
  if (!fn) throw new HttpError(404, 'Unknown action.');

  const c = await M.getConnection();
  try {
    await c.beginTransaction();
    const r = await M.lockRequest(c, id);
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

  // After the commit, so a PDF problem never undoes the issued certificate.
  if (name === 'generate') {
    try { await attachPdf(id); }
    catch (e) { console.error('PDF generation failed', e); }
  }
}