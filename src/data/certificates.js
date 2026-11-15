// TODO: confirm all fees / payment rules with the parish. Values below are samples from the draft.
export const CERT_TYPES = [
  { id: 'baptismal', title: 'Baptismal Certificate', desc: 'Request a copy of a baptismal certificate.', icon: 'fa-solid fa-water-ladder', to: '/request/baptismal' },
  { id: 'confirmation', title: 'Confirmation Certificate', desc: 'Request a copy of a confirmation certificate.', icon: 'fa-solid fa-dove', to: '/request/confirmation' },
  { id: 'marriage', title: 'Marriage Contract Certificate', desc: 'Request a copy of a marriage certificate.', icon: 'fa-solid fa-ring' },
  { id: 'no-record-baptism', title: 'No Record of Baptism', desc: 'For individuals whose baptismal records cannot be found in the parish records.', icon: 'fa-solid fa-file-circle-xmark', to: '/request/no-record/baptism' },
  { id: 'no-record-confirmation', title: 'No Record of Confirmation', desc: 'For individuals whose confirmation records cannot be found in the parish records.', icon: 'fa-solid fa-file-circle-xmark', to: '/request/no-record/confirmation' },
];

export const FORMATS = [
  { id: 'hardcopy', title: 'Hardcopy – For Pickup', icon: 'fa-solid fa-stamp', fee: 100, payments: ['pickup', 'gcash'],
    desc: 'Receive a physical copy with the dry seal at the parish office.' },
  { id: 'digital', title: 'Digital Copy – E-Certificate', icon: 'fa-solid fa-envelope-open-text', fee: 100, payments: ['gcash'],
    desc: 'Receive an electronic certificate (with QR code) at your registered email.' },
];

export const PAYMENTS = {
  pickup: { title: 'Pay upon pickup', tag: 'Hardcopy only', icon: 'fa-solid fa-hand-holding-dollar',
    desc: 'Pay the certificate fee at the parish office when you claim it.' },
  gcash: { title: 'GCash', tag: 'Online payment', icon: 'fa-solid fa-mobile-screen',
    desc: 'Send the fee to the parish GCash account, then upload your proof of payment.' },
};

export const PURPOSES = [
  'Records / Personal Copy', 'First Communion', 'School Requirements',
  'Marriage', 'Travel / Visa', 'Late Registration of Birth Certificate',
];

// Confirmation: the fee depends on the purpose, not on the format.
export const CONFIRMATION_PURPOSES = [
  { id: 'records', label: 'Records / Personal Copy', fee: 100 },
  { id: 'marriage', label: 'Marriage', fee: 200 },
];

// No Record certificates. askBirth: only the baptism form asks for date / place of birth (per the draft).
export const NO_RECORD_TYPES = {
  baptism: { title: 'No Record of Baptism', askBirth: true },
  confirmation: { title: 'No Record of Confirmation', askBirth: false },
};
// TODO: fees for No Record certificates are not set yet. Sample amount only.
export const NO_RECORD_FEE = 100;

// TODO: replace with the parish's official GCash details (ideally from an API / config, not hardcoded)
export const GCASH = { number: '[parish official GCash number]', name: '[parish official account name]' };

// ---- Baptism Registration (per the draft process doc; confirm with the parish) ----
export const EXTRA_SPONSOR_FEE = 100;
// weekdays: 0 = Sunday ... 6 = Saturday. freeSponsors = number of sponsors included in the base fee.
export const BAPTISM_TYPES = [
  { id: 'special', title: 'Special Baptism', days: 'Tuesday to Saturday', weekdays: [2, 3, 4, 5, 6],
    times: ['11:00 AM', '2:00 PM'], base: 3500, stipend: 0, freeSponsors: 4,
    note: 'Includes the first two (2) pairs of sponsors (Ninong and Ninang).' },
  { id: 'common-sat', title: 'Common Baptism – Saturday', days: 'Saturday', weekdays: [6],
    times: ['10:00 AM'], base: 1200, stipend: 500, freeSponsors: 2,
    note: "₱1,200 first pair of sponsors + ₱500 priest's stipend." },
  { id: 'common-sun', title: 'Common Baptism – Sunday', days: 'Sunday', weekdays: [0],
    times: ['11:00 AM'], base: 1200, stipend: 0, freeSponsors: 2, maxAge: 7,
    note: 'First pair of sponsors included. Only children below seven (7) years old.' },
];

export function baptismFee(type, sponsorCount) {
  const extra = Math.max(0, sponsorCount - type.freeSponsors);
  const extraFee = extra * EXTRA_SPONSOR_FEE;
  return { base: type.base, stipend: type.stipend, extra, extraFee, total: type.base + type.stipend + extraFee };
}

export const BAPTISM_REQUIREMENTS = [
  'Baptismal Form – filled out by the parent/s.',
  'Birth Certificate – one (1) photocopy.',
  'Marriage Contract – one (1) photocopy (only if the parents are legally married).',
  'Certificate of No Record – required in case of late registration of the Birth Certificate.',
];
export const BAPTISM_REMINDERS = [
  'Parents are responsible for filling out the Baptismal Form.',
  'All required documents must be submitted upon registration.',
  'A Certificate of No Record is required in case of late registration of the Birth Certificate.',
  'Only children below seven (7) years old are allowed to be baptized on Sundays.',
  'NO REQUIREMENTS, NO BAPTISM.',
  'Parents must arrive at least one (1) hour before the scheduled baptism.',
];