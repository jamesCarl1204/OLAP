import { REF_CODES } from '../utils/reference.js';
import { bad, text, upper, PHONE, EMAIL, validDate, localToday, sniff } from '../utils/validate.js';
import { findActiveType, createMassIntention } from '../models/massModel.js';
import { storeFile, removeStored } from './fileStorage.js';

const PAY_METHODS = ['gcash', 'cash'];
const CONSENT_VERSION = 'v1';

// TODO: Mass times are still placeholders in the frontend, so the time is only length-checked.
// Once the parish gives the real times, seed `mass_times` and validate against it here.
export async function submitMassIntention(body, file) {
  const b = body || {};

  const type = await findActiveType(text(b.typeId, 30));
  if (!type) bad('Select the type of Mass Intention.');

  const data = {
    requestor: upper(b.requestor),
    phone: text(b.phone, 30),
    email: text(b.email).toLowerCase() || null,
    prayedFor: upper(b.prayedFor),
    special: upper(b.special, 1000) || null,
    date: text(b.date, 10),
    time: text(b.time, 30),
  };
  if (!data.requestor || !data.prayedFor) bad('Enter the requestor and the name of the person to be prayed for.');
  if (!PHONE.test(data.phone.replace(/[\s-]/g, ''))) bad('Enter a valid mobile number, e.g. 0917 123 4567.');
  if (data.email && !EMAIL.test(data.email)) bad('Enter a valid email address.');
  if (!validDate(data.date) || data.date < localToday()) bad('Choose a valid preferred date.');
  if (!data.time) bad('Choose your preferred Mass time.');
  if (b.consent !== 'true') bad('Please agree to the data privacy notice to continue.');

  const method = text(b.method, 20);
  if (!PAY_METHODS.includes(method)) bad('Select a payment method.');
  const payment = { method, gcash_ref: null };
  let proofKind = null;
  if (method === 'gcash') {
    payment.gcash_ref = text(b.gcashRef, 50);
    if (!payment.gcash_ref) bad('Enter your GCash reference number.');
    if (!file) bad('Upload your GCash payment receipt (screenshot).');
    proofKind = sniff(file.buffer);
    if (!proofKind) bad('Receipt must be a JPG, PNG, or PDF file.');
  }

  const stored = [];
  try {
    let proof = null;
    if (proofKind) {
      proof = await storeFile(file, proofKind, 'payment-proofs');
      stored.push(proof);
    }
    return await createMassIntention({
      type, code: REF_CODES.mass, data, proof, payment, consentVersion: CONSENT_VERSION,
    });
  } catch (e) {
    await removeStored(stored);
    throw e;
  }
}