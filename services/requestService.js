import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PROOF_DIR } from '../config/uploads.js';
import { REF_CODES } from '../utils/reference.js';
import { createCertificateRequest } from '../models/requestModel.js';

export class ValidationError extends Error {}
const bad = (message) => { throw new ValidationError(message); };

// TODO: keep fees in sync with src/data/certificates.js (the server decides the fee, never the client).
const BAPTISMAL_FEE = 100;
const CONFIRMATION_PURPOSES = {
  records: { label: 'Records / Personal Copy', fee: 100 },
  marriage: { label: 'Marriage', fee: 200 },
};
const BAPTISMAL_PURPOSES = [
  'Records / Personal Copy', 'First Communion', 'School Requirements',
  'Marriage', 'Travel / Visa', 'Late Registration of Birth Certificate',
];
const FORMAT_METHODS = { hardcopy: ['pickup', 'gcash'], digital: ['gcash'] };
const CONSENT_VERSION = 'v1';

// ---- helpers ----
const text = (v, max = 255) => String(v ?? '').trim().slice(0, max);
const upper = (v) => text(v).toUpperCase();
const PHONE = /^(09|\+639)\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (d) => DATE.test(d) && !Number.isNaN(new Date(d).getTime());
const todayStr = () => new Date().toISOString().slice(0, 10);

// Decide the file type from its first bytes, not from what the browser claims.
function sniff(buf) {
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length > 4 && buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return { mime: 'image/png', ext: 'png' };
  if (buf.length > 4 && buf.subarray(0, 4).toString('latin1') === '%PDF') return { mime: 'application/pdf', ext: 'pdf' };
  return null;
}

// ---- per-type rules: each returns the "person" part or throws ValidationError ----
function parseBaptismal(b) {
  const fullName = upper(b.fullName);
  const father = upper(b.father);
  const mother = upper(b.mother);
  const pob = upper(b.pob);
  const dob = text(b.dob, 10);
  const baptismDate = text(b.baptismDate, 10) || null;
  const purpose = text(b.purpose, 100);

  if (!fullName || !father || !mother || !pob) bad('Complete the name, parents, and place of birth.');
  if (!validDate(dob) || dob > todayStr()) bad('Enter a valid date of birth.');
  if (baptismDate && (!validDate(baptismDate) || baptismDate > todayStr() || baptismDate < dob))
    bad('Baptism date must be a valid date that is not earlier than the date of birth.');
  if (!BAPTISMAL_PURPOSES.includes(purpose)) bad('Select a valid purpose.');

  return {
    subject_name: fullName, father_name: father, mother_name: mother,
    birth_date: dob, birth_place: pob, event_date: baptismDate, purpose, fee: BAPTISMAL_FEE,
  };
}

function parseConfirmation(b) {
  const fullName = upper(b.fullName);
  const father = upper(b.father);
  const mother = upper(b.mother);
  const confirmationDate = text(b.confirmationDate, 10) || null;
  const purpose = CONFIRMATION_PURPOSES[text(b.purposeId, 20)];

  if (!fullName || !father || !mother) bad('Complete the name and the names of the parents.');
  if (confirmationDate && (!validDate(confirmationDate) || confirmationDate > todayStr()))
    bad('Enter a valid date of confirmation.');
  if (!purpose) bad('Select a valid purpose.');

  return {
    subject_name: fullName, father_name: father, mother_name: mother,
    birth_date: null, birth_place: null, event_date: confirmationDate, purpose: purpose.label, fee: purpose.fee,
  };
}

const KINDS = {
  baptismal: { code: REF_CODES.baptismal, parse: parseBaptismal },
  confirmation: { code: REF_CODES.confirmation, parse: parseConfirmation },
};

// ---- shared rules: contact, consent, format, payment, proof ----
function parseCommon(b, file) {
  const email = text(b.email).toLowerCase();
  const phone = text(b.phone, 30);
  const format = text(b.format, 20);
  const method = text(b.method, 20);

  if (!EMAIL.test(email)) bad('Enter a valid email address.');
  if (!PHONE.test(phone.replace(/[\s-]/g, ''))) bad('Enter a valid mobile number, e.g. 0917 123 4567.');
  if (b.consent !== 'true') bad('Please agree to the data privacy notice to continue.');
  if (!FORMAT_METHODS[format]) bad('Select a certificate format.');
  if (!FORMAT_METHODS[format].includes(method)) bad('That payment method is not available for this format.');

  const payment = { method, sender_number: null, sender_name: null };
  let proofType = null;
  if (method === 'gcash') {
    payment.sender_number = text(b.gcashNumber, 30);
    payment.sender_name = upper(b.gcashName);
    if (!PHONE.test(payment.sender_number.replace(/[\s-]/g, ''))) bad("Enter the sender's GCash number.");
    if (!payment.sender_name) bad("Enter the sender's account name.");
    if (!file) bad('Upload your proof of payment.');
    proofType = sniff(file.buffer);
    if (!proofType) bad('Proof of payment must be a JPG, PNG, or PDF file.');
  }
  return { contact: { email, phone, format }, payment, proofType };
}

// ---- file storage ----
async function storeProof(file, proofType) {
  const storageKey = `payment-proofs/${crypto.randomUUID()}.${proofType.ext}`;
  await fs.writeFile(path.join(PROOF_DIR, storageKey), file.buffer, { flag: 'wx' });
  return {
    storage_key: storageKey,
    original_name: path.basename(file.originalname || 'proof').slice(0, 255),
    mime_type: proofType.mime,
    size_bytes: file.size,
    sha256: crypto.createHash('sha256').update(file.buffer).digest('hex'),
  };
}

// ---- entry point used by the controller ----
// kind: 'baptismal' | 'confirmation'. Returns the reference number.
export async function submitCertificateRequest(kind, body, file) {
  const cfg = KINDS[kind];
  if (!cfg) throw new Error(`Unknown request kind: ${kind}`);

  const person = cfg.parse(body);
  const { contact, payment, proofType } = parseCommon(body, file);

  const stored = proofType ? await storeProof(file, proofType) : null;
  try {
    return await createCertificateRequest({
      type: kind, code: cfg.code, person, contact, payment, file: stored, consentVersion: CONSENT_VERSION,
    });
  } catch (e) {
    // The DB rolled back, so do not leave an orphan file behind.
    if (stored) await fs.unlink(path.join(PROOF_DIR, stored.storage_key)).catch(() => {});
    throw e;
  }
}