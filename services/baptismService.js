import { REF_CODES } from '../utils/reference.js';
import { bad, text, upper, PHONE, EMAIL, validDate, localToday, sniff } from '../utils/validate.js';
import { findActiveType, createBaptismRegistration } from '../models/baptismModel.js';
import { storeFile, removeStored } from './fileStorage.js';

// TODO: keep in sync with EXTRA_SPONSOR_FEE in src/data/certificates.js (the server decides the fee).
const EXTRA_SPONSOR_FEE = 100;
const MARRIAGE_KINDS = { Catholic: 'catholic', 'Non-Catholic': 'non_catholic', Civil: 'civil' };
const PAY_METHODS = ['pickup', 'gcash'];
const CONSENT_VERSION = 'v1';

const asArray = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

function yearsBetween(dob, on) {
  const a = new Date(dob);
  const b = new Date(on);
  let y = b.getUTCFullYear() - a.getUTCFullYear();
  const m = b.getUTCMonth() - a.getUTCMonth();
  if (m < 0 || (m === 0 && b.getUTCDate() < a.getUTCDate())) y--;
  return y;
}

function inspect(file, label) {
  const kind = sniff(file.buffer);
  if (!kind) bad(`${label} must be a JPG, PNG, or PDF file.`);
  return kind;
}

// body: multipart text fields. files: multer `fields` result.
export async function submitBaptismRegistration(body, files) {
  const b = body || {};
  const pick = (name) => files?.[name]?.[0] || null;

  // ---- type and schedule (rules come from the baptism_types table) ----
  const type = await findActiveType(text(b.typeId, 30));
  if (!type) bad('Select a baptism type.');
  const date = text(b.date, 10);
  const time = text(b.time, 20);
  if (!validDate(date) || date < localToday()) bad('Choose a valid preferred date.');
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (!asArray(type.weekdays).includes(weekday)) bad(`${type.title} is not available on that day.`);
  if (!asArray(type.times).includes(time)) bad('Choose a valid time.');

  // ---- child and parents ----
  const data = {
    date, time,
    surname: upper(b.surname, 100), given: upper(b.given, 100), middle: upper(b.middle, 100) || null,
    dob: text(b.dob, 10), pob: upper(b.pob),
    father: upper(b.father), fatherPob: upper(b.fatherPob),
    mother: upper(b.mother), motherPob: upper(b.motherPob),
    marriageKind: MARRIAGE_KINDS[text(b.marriageKind, 20)],
    venue: upper(b.venue), address: upper(b.address, 500),
    marriedLegally: b.marriedLegally === 'true', lateBirthReg: b.lateBirthReg === 'true',
    email: text(b.email).toLowerCase(), phone: text(b.phone, 30), parentName: upper(b.parentName),
  };
  if (!data.surname || !data.given || !data.pob) bad("Complete the child's name and place of birth.");
  if (!validDate(data.dob) || data.dob > localToday()) bad('Enter a valid date of birth.');
  if (type.max_age && yearsBetween(data.dob, date) >= type.max_age)
    bad(`Only children below ${type.max_age} years old can be baptized on this schedule.`);
  if (!data.father || !data.fatherPob || !data.mother || !data.motherPob) bad("Complete the parents' names and places of birth.");
  if (!data.marriageKind) bad('Select the kind of marriage.');
  if (!data.venue || !data.address || !data.parentName) bad('Complete the church, address, and parent name.');
  if (!EMAIL.test(data.email)) bad('Enter a valid email address.');
  if (!PHONE.test(data.phone.replace(/[\s-]/g, ''))) bad('Enter a valid mobile number, e.g. 0917 123 4567.');
  if (b.conforme !== 'true') bad('Please confirm the Conforme to continue.');

  // ---- sponsors ----
  let raw = null;
  try { raw = JSON.parse(b.sponsors || '[]'); } catch { /* handled below */ }
  if (!Array.isArray(raw) || raw.length > 20) bad('Invalid sponsors.');
  const sponsors = raw
    .map((s) => ({ full_name: upper(s?.name), address: upper(s?.address, 500) }))
    .filter((s) => s.full_name || s.address);
  if (sponsors.length < 2 || sponsors.slice(0, 2).some((s) => !s.full_name || !s.address))
    bad('Enter the name and address of at least one pair of sponsors (Ninong and Ninang).');
  if (sponsors.some((s) => !s.full_name || !s.address)) bad('Complete the name and address of every sponsor.');

  // ---- requirements ----
  const docSpecs = [
    { doc_type: 'birth_certificate', field: 'birth', required: true, label: 'Birth Certificate' },
    { doc_type: 'marriage_contract', field: 'marriage', required: data.marriedLegally, label: 'Marriage Contract' },
    { doc_type: 'no_record', field: 'noRecord', required: data.lateBirthReg, label: 'Certificate of No Record' },
  ];
  const docInputs = [];
  for (const s of docSpecs) {
    const file = pick(s.field);
    if (!file) {
      if (s.required) bad(`${s.label} is required. NO REQUIREMENTS, NO BAPTISM.`);
      continue;
    }
    docInputs.push({ doc_type: s.doc_type, file, kind: inspect(file, s.label) });
  }

  // ---- payment ----
  const method = text(b.method, 20);
  if (!PAY_METHODS.includes(method)) bad('Select a payment method.');
  const payment = { method, sender_number: null, sender_name: null };
  let proofInput = null;
  if (method === 'gcash') {
    payment.sender_number = text(b.gcashNumber, 30);
    payment.sender_name = upper(b.gcashName);
    if (!PHONE.test(payment.sender_number.replace(/[\s-]/g, ''))) bad("Enter the sender's GCash number.");
    if (!payment.sender_name) bad("Enter the sender's account name.");
    const file = pick('proof');
    if (!file) bad('Upload your proof of payment.');
    proofInput = { file, kind: inspect(file, 'Proof of payment') };
  }

  // ---- fee (server-side) ----
  const extraCount = Math.max(0, sponsors.length - type.free_sponsors);
  const fee = { base: Number(type.base_fee), stipend: Number(type.stipend), extra: extraCount * EXTRA_SPONSOR_FEE };
  fee.total = fee.base + fee.stipend + fee.extra;

  // ---- save files, then the database rows ----
  const stored = [];
  try {
    const docs = [];
    for (const d of docInputs) {
      const rec = await storeFile(d.file, d.kind, 'baptism-docs');
      stored.push(rec);
      docs.push({ doc_type: d.doc_type, file: rec });
    }
    let proof = null;
    if (proofInput) {
      proof = await storeFile(proofInput.file, proofInput.kind, 'payment-proofs');
      stored.push(proof);
    }
    return await createBaptismRegistration({
      type, code: REF_CODES.baptism_registration, data, sponsors, docs, proof, payment, fee, consentVersion: CONSENT_VERSION,
    });
  } catch (e) {
    await removeStored(stored);
    throw e;
  }
}