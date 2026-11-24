import { REF_CODES } from '../utils/reference.js';
import { bad, text, upper, PHONE, EMAIL, validDate, localToday, sniff } from '../utils/validate.js';
import { isSlotTaken, createMarriageBooking } from '../models/marriageModel.js';
import { storeFile, removeStored } from './fileStorage.js';

// TODO: keep fees in sync with MARRIAGE_TYPES in src/data/certificates.js (the server decides the fee).
const TYPES = { ordinary: 10000, special: 15000 };
const PAY_METHODS = ['pickup', 'gcash'];
const CONSENT_VERSION = 'v1';
const DOCS = [
  { field: 'groomBaptism', doc_type: 'groom_baptismal', label: "Groom's Baptismal Certificate" },
  { field: 'groomConfirmation', doc_type: 'groom_confirmation', label: "Groom's Confirmation Certificate" },
  { field: 'brideBaptism', doc_type: 'bride_baptismal', label: "Bride's Baptismal Certificate" },
  { field: 'brideConfirmation', doc_type: 'bride_confirmation', label: "Bride's Confirmation Certificate" },
  { field: 'license', doc_type: 'marriage_license', label: 'Marriage License' },
];

// Earliest wedding date: today + 1 month, server local time.
function minDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// TODO: wedding times are placeholders in the frontend, so the time is only length-checked.
export async function submitMarriageBooking(body, files) {
  const b = body || {};
  const pick = (name) => files?.[name]?.[0] || null;

  const type = text(b.typeId, 20);
  if (!Object.hasOwn(TYPES, type)) bad('Select a marriage type.');

  const data = {
    date: text(b.date, 10), time: text(b.time, 30),
    groomName: upper(b.groomName), groomDob: text(b.groomDob, 10), groomPob: upper(b.groomPob),
    brideName: upper(b.brideName), brideDob: text(b.brideDob, 10), bridePob: upper(b.bridePob),
    address: upper(b.address, 500), contactName: upper(b.contactName),
    email: text(b.email).toLowerCase(), phone: text(b.phone, 30),
  };
  if (!validDate(data.date) || data.date < minDate()) bad('The wedding must be booked at least 1 month before the wedding date.');
  if (!data.time) bad('Choose a time.');
  if (!data.groomName || !data.groomPob || !data.brideName || !data.bridePob) bad('Complete the names and places of birth of the groom and bride.');
  if (!validDate(data.groomDob) || data.groomDob > localToday()) bad("Enter a valid date of birth for the groom.");
  if (!validDate(data.brideDob) || data.brideDob > localToday()) bad("Enter a valid date of birth for the bride.");
  if (!data.address || !data.contactName) bad('Complete the address and contact person.');
  if (!EMAIL.test(data.email)) bad('Enter a valid email address.');
  if (!PHONE.test(data.phone.replace(/[\s-]/g, ''))) bad('Enter a valid mobile number, e.g. 0917 123 4567.');
  if (b.consent !== 'true') bad('Please agree to the data privacy notice to continue.');
  if (await isSlotTaken(data.date, data.time)) bad('That date and time is already taken. Please choose another schedule.');

  const docInputs = DOCS.map((s) => {
    const file = pick(s.field);
    if (!file) bad(`${s.label} is required. NO REQUIREMENTS, NO WEDDING.`);
    const kind = sniff(file.buffer);
    if (!kind) bad(`${s.label} must be a JPG, PNG, or PDF file.`);
    return { doc_type: s.doc_type, file, kind };
  });

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
    const kind = sniff(file.buffer);
    if (!kind) bad('Proof of payment must be a JPG, PNG, or PDF file.');
    proofInput = { file, kind };
  }

  const stored = [];
  try {
    const docs = [];
    for (const d of docInputs) {
      const rec = await storeFile(d.file, d.kind, 'marriage-docs');
      stored.push(rec);
      docs.push({ doc_type: d.doc_type, file: rec });
    }
    let proof = null;
    if (proofInput) {
      proof = await storeFile(proofInput.file, proofInput.kind, 'payment-proofs');
      stored.push(proof);
    }
    return await createMarriageBooking({
      code: REF_CODES.marriage, type, data, docs, proof, payment, fee: TYPES[type], consentVersion: CONSENT_VERSION,
    });
  } catch (e) {
    await removeStored(stored);
    throw e;
  }
}