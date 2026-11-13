// TODO: confirm all fees / payment rules with the parish. Values below are samples from the draft.
export const CERT_TYPES = [
  { id: 'baptismal', title: 'Baptismal Certificate', desc: 'Request a copy of a baptismal certificate.', icon: 'fa-solid fa-water-ladder', to: '/request/baptismal' },
  { id: 'confirmation', title: 'Confirmation Certificate', desc: 'Request a copy of a confirmation certificate.', icon: 'fa-solid fa-dove' },
  { id: 'marriage', title: 'Marriage Contract Certificate', desc: 'Request a copy of a marriage certificate.', icon: 'fa-solid fa-ring' },
  { id: 'no-record', title: 'No Record of Baptism / Confirmation', desc: 'Request certification that no corresponding record was found.', icon: 'fa-solid fa-file-circle-xmark' },
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

// TODO: replace with the parish's official GCash details (ideally from an API / config, not hardcoded)
export const GCASH = { number: '[parish official GCash number]', name: '[parish official account name]' };