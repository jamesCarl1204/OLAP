// MOCK DATA for the staff portal UI. Shapes follow the OLAP database tables.
// TODO: replace with API calls once the backend is ready.
export const PARISH_PRIEST = 'REV. FR. RICARDO F. VALENCIA, JR.';
export const STATUS = {
  submitted:     { label: 'Submitted',     tone: 'info' },
  payment_check: { label: 'Payment Check', tone: 'warn' },
  record_check:  { label: 'Record Check',  tone: 'warn' },
  ready:         { label: 'Ready',         tone: 'ok' },
  released:      { label: 'Released',      tone: 'done' },
  sent:          { label: 'Sent',          tone: 'done' },
  on_hold:       { label: 'On Hold',       tone: 'muted' },
  rejected:      { label: 'Rejected',      tone: 'bad' },
};

export const CERT_LABELS = {
  baptismal: 'Baptismal',
  confirmation: 'Confirmation',
  marriage: 'Marriage',
  no_record_baptism: 'No Record (Baptism)',
  no_record_confirmation: 'No Record (Confirmation)',
};

export const PAYMENT_STATUS = {
  pending:        { label: 'Pending',        tone: 'warn' },
  verified:       { label: 'Verified',       tone: 'ok' },
  rejected:       { label: 'Rejected',       tone: 'bad' },
  paid_on_pickup: { label: 'Pay on pickup',  tone: 'info' },
};

export const REQUESTS = [
  { id: 1, reference_no: 'OLAP-2026-00001', certificate_type: 'baptismal', format: 'digital', status: 'payment_check',
    subject_name: 'JUAN TOLONGES DELA CRUZ', father_name: 'PEDRO DELA CRUZ', mother_name: 'MARIA TOLONGES',
    birth_date: '1998-03-14', birth_place: 'PARAÑAQUE CITY', event_date: '1998-05-02', purpose: 'Marriage',
    requester_name: 'Juan Dela Cruz', contact_email: 'juan@email.com', contact_phone: '0917 123 4567',
    fee_amount: 100, submitted_at: '2026-11-14T09:30:00',
    payment: { method: 'gcash', status: 'pending', sender_gcash_number: '0917 123 4567', sender_account_name: 'JUAN D CRUZ', proof_name: 'gcash-receipt.jpg' } },
  { id: 2, reference_no: 'OLAP-2026-00002', certificate_type: 'confirmation', format: 'hardcopy', status: 'submitted',
    subject_name: 'ANA LIZA REYES', father_name: 'ROBERTO REYES', mother_name: 'CARMEN SANTOS',
    birth_date: null, birth_place: null, event_date: null, purpose: 'Records / Personal Copy',
    requester_name: 'Ana Liza Reyes', contact_email: 'ana.reyes@email.com', contact_phone: '0928 555 0101',
    fee_amount: 100, submitted_at: '2026-11-15T08:10:00',
    payment: { method: 'pickup', status: 'paid_on_pickup' } },
  { id: 3, reference_no: 'OLAP-2026-00003', certificate_type: 'baptismal', format: 'hardcopy', status: 'record_check',
    subject_name: 'MARK ANTHONY GARCIA', father_name: 'ANTONIO GARCIA', mother_name: 'LUZ BAUTISTA',
    birth_date: '2001-07-21', birth_place: 'MANILA', event_date: '2001-09-09', purpose: 'School Requirements',
    requester_name: 'Luz Garcia', contact_email: 'luzgarcia@email.com', contact_phone: '0915 222 3344',
    fee_amount: 100, submitted_at: '2026-11-12T14:45:00',
    payment: { method: 'gcash', status: 'verified', sender_gcash_number: '0915 222 3344', sender_account_name: 'LUZ GARCIA', proof_name: 'proof.png' } },
  { id: 4, reference_no: 'OLAP-2026-00004', certificate_type: 'confirmation', format: 'digital', status: 'ready',
    subject_name: 'KRISTINE JOY MENDOZA', father_name: 'EDGAR MENDOZA', mother_name: 'JOY LIM',
    birth_date: null, birth_place: null, event_date: '2012-04-22', purpose: 'Marriage',
    requester_name: 'Kristine Mendoza', contact_email: 'kjmendoza@email.com', contact_phone: '0999 888 7766',
    fee_amount: 200, submitted_at: '2026-11-10T10:00:00',
    payment: { method: 'gcash', status: 'verified', sender_gcash_number: '0999 888 7766', sender_account_name: 'KRISTINE J MENDOZA', proof_name: 'receipt.pdf' } },
  { id: 5, reference_no: 'OLAP-2026-00005', certificate_type: 'baptismal', format: 'hardcopy', status: 'released',
    subject_name: 'PAOLO MIGUEL SANTOS', father_name: 'MIGUEL SANTOS', mother_name: 'ROSA DIAZ',
    birth_date: '1995-01-30', birth_place: 'PASAY CITY', event_date: '1995-03-12', purpose: 'Travel / Visa',
    requester_name: 'Paolo Santos', contact_email: 'paolo.s@email.com', contact_phone: '0917 000 1122',
    fee_amount: 100, submitted_at: '2026-11-05T11:20:00',
    payment: { method: 'pickup', status: 'paid_on_pickup' } },
  { id: 6, reference_no: 'OLAP-2026-00006', certificate_type: 'confirmation', format: 'digital', status: 'on_hold',
    subject_name: 'ELENA MARIE CRUZ', father_name: 'RICARDO CRUZ', mother_name: 'ELENA BERNAL',
    birth_date: null, birth_place: null, event_date: null, purpose: 'Records / Personal Copy',
    requester_name: 'Elena Cruz', contact_email: 'elena.cruz@email.com', contact_phone: '0922 333 4455',
    fee_amount: 100, submitted_at: '2026-11-08T16:05:00',
    payment: { method: 'gcash', status: 'rejected', sender_gcash_number: '0922 333 4455', sender_account_name: 'ELENA CRUZ', proof_name: 'blurry.jpg', reject_reason: 'Proof of payment is unreadable.' } },
  { id: 7, reference_no: 'OLAP-2026-00007', certificate_type: 'baptismal', format: 'digital', status: 'sent',
    subject_name: 'JOSE RIZALDY BAUTISTA', father_name: 'RIZALDO BAUTISTA', mother_name: 'TERESA ONG',
    birth_date: '1990-12-05', birth_place: 'QUEZON CITY', event_date: '1991-01-20', purpose: 'Records / Personal Copy',
    requester_name: 'Jose Bautista', contact_email: 'jose.b@email.com', contact_phone: '0918 777 6655',
    fee_amount: 100, submitted_at: '2026-11-01T09:00:00',
    payment: { method: 'gcash', status: 'verified', sender_gcash_number: '0918 777 6655', sender_account_name: 'JOSE BAUTISTA', proof_name: 'gcash.jpg' } },
  { id: 8, reference_no: 'OLAP-2026-00008', certificate_type: 'confirmation', format: 'hardcopy', status: 'rejected',
    subject_name: 'RAMON PEÑA', father_name: 'DANILO PEÑA', mother_name: 'IRENE LOPEZ',
    birth_date: null, birth_place: null, event_date: null, purpose: 'Marriage',
    requester_name: 'Ramon Peña', contact_email: 'ramonp@email.com', contact_phone: '0933 444 1212',
    fee_amount: 200, submitted_at: '2026-10-28T13:15:00',
    payment: { method: 'pickup', status: 'pending' } },
  { id: 9, reference_no: 'OLAP-2026-00009', certificate_type: 'no_record_baptism', format: 'hardcopy', status: 'record_check',
    subject_name: 'JUAN TOLONGES DELA CRUZ', father_name: 'POPOY DELA CRUZ', mother_name: 'MARITES TOLONGES',
    birth_date: '2025-12-26', birth_place: 'MANILA', event_date: null, purpose: null,
    destination_church: 'ST. ANDREW CATHEDRAL', destination_city: 'PARAÑAQUE CITY',
    requester_name: 'Marites Tolonges', contact_email: 'marites@email.com', contact_phone: '0917 000 9999',
    fee_amount: 100, submitted_at: '2026-11-13T10:00:00',
    payment: { method: 'pickup', status: 'paid_on_pickup' } },
];

export const EVENTS = {
  1: [
    { type: 'submitted', note: 'Request submitted by requester.', actor: 'Requester', at: '2026-11-14T09:30:00' },
    { type: 'email_sent', note: 'Email: request received.', actor: 'System', at: '2026-11-14T09:31:00' },
    { type: 'status_changed', note: 'Moved to Payment Check.', actor: 'Parish Staff', at: '2026-11-14T13:00:00' },
  ],
  3: [
    { type: 'submitted', note: 'Request submitted by requester.', actor: 'Requester', at: '2026-11-12T14:45:00' },
    { type: 'payment_verified', note: 'GCash payment verified.', actor: 'Parish Staff', at: '2026-11-13T09:10:00' },
  ],
  6: [
    { type: 'submitted', note: 'Request submitted by requester.', actor: 'Requester', at: '2026-11-08T16:05:00' },
    { type: 'payment_rejected', note: 'Proof of payment is unreadable.', actor: 'Parish Staff', at: '2026-11-09T10:00:00' },
  ],
};

export const REGISTRY = [
  { id: 1, record_type: 'baptism', full_name: 'JUAN TOLONGES DELA CRUZ', father_name: 'PEDRO DELA CRUZ', mother_name: 'MARIA TOLONGES', birth_date: '1998-03-14', birth_place: 'PARAÑAQUE CITY', event_date: '1998-05-02', officiant: 'FR. ANTONIO REYES', book_no: '12', page_no: '45', line_no: '7' },
  { id: 2, record_type: 'baptism', full_name: 'MARK ANTHONY GARCIA', father_name: 'ANTONIO GARCIA', mother_name: 'LUZ BAUTISTA', birth_date: '2001-07-21', birth_place: 'MANILA', event_date: '2001-09-09', officiant: 'FR. ANTONIO REYES', book_no: '14', page_no: '8', line_no: '3' },
  { id: 3, record_type: 'confirmation', full_name: 'KRISTINE JOY MENDOZA', father_name: 'EDGAR MENDOZA', mother_name: 'JOY LIM', birth_date: null, birth_place: null, event_date: '2012-04-22', officiant: 'BISHOP LUIS CRUZ', book_no: '5', page_no: '31', line_no: '12' },
  { id: 4, record_type: 'baptism', full_name: 'PAOLO MIGUEL SANTOS', father_name: 'MIGUEL SANTOS', mother_name: 'ROSA DIAZ', birth_date: '1995-01-30', birth_place: 'PASAY CITY', event_date: '1995-03-12', officiant: 'FR. JOSE LIM', book_no: '9', page_no: '60', line_no: '2' },
];

export const MARRIAGES = [
  { id: 1, groom_name: 'ROBERTO MENDOZA', bride_name: 'ANGELA TAN', marriage_date: '2015-06-20', officiant: 'FR. ANTONIO REYES', witnesses: 'JOSE LIM; MARIA CRUZ', book_no: '3', page_no: '22', line_no: '5' },
  { id: 2, groom_name: 'DANIEL BAUTISTA', bride_name: 'CHERRY ONG', marriage_date: '2019-02-14', officiant: 'FR. JOSE LIM', witnesses: 'LUIS REYES; ANA SANTOS', book_no: '4', page_no: '10', line_no: '1' },
];

export const EMAILS = [
  { id: 1, request_id: 1, reference_no: 'OLAP-2026-00001', to_email: 'juan@email.com', template_key: 'request_received', subject: 'We received your request', status: 'sent', attempts: 1, last_error: null, queued_at: '2026-11-14T09:31:00' },
  { id: 2, request_id: 6, reference_no: 'OLAP-2026-00006', to_email: 'elena.cruz@email.com', template_key: 'payment_rejected', subject: 'Payment could not be verified', status: 'failed', attempts: 3, last_error: 'SMTP connection timeout', queued_at: '2026-11-09T10:01:00' },
  { id: 3, request_id: 7, reference_no: 'OLAP-2026-00007', to_email: 'jose.b@email.com', template_key: 'digital_certificate', subject: 'Your e-certificate', status: 'sent', attempts: 1, last_error: null, queued_at: '2026-11-03T15:00:00' },
  { id: 4, request_id: 4, reference_no: 'OLAP-2026-00004', to_email: 'kjmendoza@email.com', template_key: 'ready_for_pickup', subject: 'Your certificate is ready', status: 'queued', attempts: 0, last_error: null, queued_at: '2026-11-15T07:50:00' },
];

export const peso = (n) => `₱${Number(n).toFixed(2)}`;
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export const fmtLong = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

// Already-issued certificates (issued_certificates table), keyed by request id.
export const ISSUED = {
  5: { certificate_no: null, verify_token: null, signed_by: 'FR. ANTONIO REYES', issued_by: 'Parish Staff', issued_at: '2026-11-06T10:00:00' },
  7: { certificate_no: 'OLAP-CERT-2026-0001', verify_token: 'a91f3c7e5b2d4086', signed_by: 'FR. ANTONIO REYES', issued_by: 'Parish Staff', issued_at: '2026-11-02T14:00:00' },
};

// Fake GCash receipt image so the proof viewer has something to show.
// In the real system this is the uploaded file (files table, storage_key).
const receiptSvg = (r) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640">
  <rect width="480" height="640" fill="#f4f7fb"/><rect width="480" height="96" fill="#0b63f6"/>
  <text x="32" y="60" font-family="Arial" font-size="30" font-weight="700" fill="#fff">GCash</text>
  <text x="32" y="150" font-family="Arial" font-size="18" fill="#334155">Express Send</text>
  <text x="32" y="205" font-family="Arial" font-size="44" font-weight="700" fill="#0f172a">PHP ${r.fee_amount}.00</text>
  <line x1="32" y1="240" x2="448" y2="240" stroke="#cbd5e1"/>
  <text x="32" y="285" font-family="Arial" font-size="15" fill="#64748b">Sent to</text>
  <text x="32" y="312" font-family="Arial" font-size="19" fill="#0f172a">OLAP PARISH</text>
  <text x="32" y="365" font-family="Arial" font-size="15" fill="#64748b">Sent from</text>
  <text x="32" y="392" font-family="Arial" font-size="19" fill="#0f172a">${r.payment.sender_account_name}</text>
  <text x="32" y="425" font-family="Arial" font-size="16" fill="#334155">${r.payment.sender_gcash_number}</text>
  <text x="32" y="480" font-family="Arial" font-size="15" fill="#64748b">Ref. No.</text>
  <text x="32" y="507" font-family="Arial" font-size="19" fill="#0f172a">${String(7000000000 + r.id * 13579)}</text>
  <text x="32" y="600" font-family="Arial" font-size="13" fill="#94a3b8">Sample receipt (mock data)</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const SPONSORS = { 1: ['MARIA SANTOS', 'JOSE MARI CHAN'], 2: ['ANA REYES', 'PEDRO REYES'], 4: ['LUIS GOMEZ', 'ROSA LIM'] };
REGISTRY.forEach((r) => { if (SPONSORS[r.id]) r.sponsors = SPONSORS[r.id]; });

REQUESTS.forEach((r) => {
  const p = r.payment;
  if (p.method === 'gcash' && p.proof_name) {
    const isPdf = p.proof_name.toLowerCase().endsWith('.pdf');
    p.proof = { name: p.proof_name, type: isPdf ? 'pdf' : 'image', size_kb: 240, uploaded_at: r.submitted_at, url: isPdf ? null : receiptSvg(r) };
  }
});

// =====================================================================
// Baptism Registration + Mass Intention (staff side mock data)
// =====================================================================
export const BAPTISM_STATUS = {
  pending:   { label: 'Pending',   tone: 'warn' },
  approved:  { label: 'Approved',  tone: 'ok' },
  completed: { label: 'Completed', tone: 'done' },
  on_hold:   { label: 'On Hold',   tone: 'muted' },
  rejected:  { label: 'Rejected',  tone: 'bad' },
};
export const MASS_STATUS = {
  pending:   { label: 'Pending',   tone: 'warn' },
  approved:  { label: 'Approved',  tone: 'ok' },
  completed: { label: 'Completed', tone: 'done' },
  rejected:  { label: 'Rejected',  tone: 'bad' },
};
export const MASS_PAYMENT = {
  pending_payment:  { label: 'Pending Payment',  tone: 'warn' },
  for_verification: { label: 'For Verification', tone: 'info' },
  paid:             { label: 'Paid',             tone: 'ok' },
  rejected:         { label: 'Rejected',         tone: 'bad' },
};

const docSvg = (label) => `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640"><rect width="480" height="640" fill="#fff" stroke="#cbd5e1"/><text x="240" y="300" text-anchor="middle" font-family="Arial" font-size="22" fill="#334155">${label}</text><text x="240" y="340" text-anchor="middle" font-family="Arial" font-size="13" fill="#94a3b8">Sample upload (mock data)</text></svg>`)}`;
const mockFile = (key, label, name, at) => ({ key, label, name, type: 'image', size_kb: 180, uploaded_at: at, url: docSvg(label) });
const mockProof = (fee, payment, id, at) => ({ name: 'gcash-proof.jpg', type: 'image', size_kb: 240, uploaded_at: at, url: receiptSvg({ fee_amount: fee, payment, id }) });

const bPay1 = { method: 'gcash', status: 'pending', sender_gcash_number: '0917 000 9999', sender_account_name: 'MARITES TOLONGES' };
export const BAPTISMS = [
  { id: 1, reference_no: 'OLAP-2026-00010', type_id: 'common-sat', date: '2027-01-09', time: '10:00 AM', confirmed_date: '2027-01-09', confirmed_time: '10:00 AM',
    status: 'pending', submitted_at: '2026-11-15T09:00:00', fee_total: 1900,
    child: { surname: 'DELA CRUZ', given: 'JUAN', middle: 'TOLONGES', dob: '2025-12-26', pob: 'MANILA' },
    father: { name: 'POPOY DELA CRUZ', pob: 'MANILA' }, mother: { name: 'MARITES TOLONGES', pob: 'QUEZON CITY' },
    marriage_kind: 'Catholic', venue: 'SAMPLE PARISH, PASAY CITY', address: '123 SAMPLE STREET, PASAY CITY',
    sponsors: [
      { name: 'MARIA SANTOS', address: 'PASAY CITY' }, { name: 'JOSE MARI CHAN', address: 'PASAY CITY' },
      { name: 'ANA REYES', address: 'PARAÑAQUE CITY' }, { name: 'PEDRO REYES', address: 'PARAÑAQUE CITY' },
    ],
    email: 'marites@email.com', phone: '0917 000 9999', parent_name: 'MARITES TOLONGES',
    married_legally: true, late_birth_reg: false,
    files: [mockFile('birth', 'Birth Certificate', 'birth-cert.jpg', '2026-11-15T09:00:00'), mockFile('marriage', 'Marriage Contract', 'marriage.jpg', '2026-11-15T09:00:00')],
    payment: { ...bPay1, proof: mockProof(1900, bPay1, 101, '2026-11-15T09:00:00') },
    staff: { priest: '', book: '', page: '', line: '', stipend: '', received_by: '' } },
  { id: 2, reference_no: 'OLAP-2026-00011', type_id: 'special', date: '2027-01-12', time: '2:00 PM', confirmed_date: '2027-01-12', confirmed_time: '2:00 PM',
    status: 'pending', submitted_at: '2026-11-14T15:30:00', fee_total: 3500,
    child: { surname: 'GARCIA', given: 'SOFIA', middle: 'BAUTISTA', dob: '2026-03-02', pob: 'PASAY CITY' },
    father: { name: 'ANTONIO GARCIA', pob: 'MANILA' }, mother: { name: 'LUZ BAUTISTA', pob: 'PASAY CITY' },
    marriage_kind: 'Civil', venue: 'PASAY CITY HALL', address: '45 SAMPLE AVE., PASAY CITY',
    sponsors: [
      { name: 'LUIS GOMEZ', address: 'PASAY CITY' }, { name: 'ROSA LIM', address: 'PASAY CITY' },
      { name: 'DANIEL BAUTISTA', address: 'MANILA' }, { name: 'CHERRY ONG', address: 'MANILA' },
    ],
    email: 'luzgarcia@email.com', phone: '0915 222 3344', parent_name: 'LUZ BAUTISTA',
    married_legally: true, late_birth_reg: true,
    files: [mockFile('birth', 'Birth Certificate', 'birth.jpg', '2026-11-14T15:30:00'), mockFile('marriage', 'Marriage Contract', 'marriage.jpg', '2026-11-14T15:30:00')],
    payment: { method: 'pickup', status: 'paid_on_pickup', proof: null },
    staff: { priest: '', book: '', page: '', line: '', stipend: '', received_by: '' } },
];

const mPay1 = { method: 'gcash', status: 'for_verification', gcash_ref: '1234 567 890123' };
const mPay3 = { method: 'gcash', status: 'paid', gcash_ref: '9876 543 210987' };
export const MASSES = [
  { id: 1, reference_no: 'OLAP-2026-00012', requestor: 'MARITES TOLONGES', phone: '0917 000 9999', email: 'marites@email.com',
    prayed_for: 'JUAN TOLONGES DELA CRUZ', special: 'PLEASE INCLUDE THE FAMILY IN THE PRAYER.', type_id: 'birthday',
    date: '2027-01-16', time: '[Mass time 1]', confirmed_date: '2027-01-16', confirmed_time: '[Mass time 1]',
    status: 'pending', submitted_at: '2026-11-15T10:00:00',
    payment: { ...mPay1, proof: mockProof(0, { sender_account_name: 'MARITES TOLONGES', sender_gcash_number: '0917 000 9999' }, 201, '2026-11-15T10:00:00') } },
  { id: 2, reference_no: 'OLAP-2026-00013', requestor: 'SAMPLE NAME', phone: '0928 555 0101', email: '',
    prayed_for: 'SAMPLE NAME', special: '', type_id: 'dead',
    date: '2027-01-17', time: '[Mass time 2]', confirmed_date: '2027-01-17', confirmed_time: '[Mass time 2]',
    status: 'pending', submitted_at: '2026-11-15T11:20:00',
    payment: { method: 'cash', status: 'pending_payment', gcash_ref: '', proof: null } },
  { id: 3, reference_no: 'OLAP-2026-00014', requestor: 'ROSA DIAZ', phone: '0917 000 1122', email: 'rosa.d@email.com',
    prayed_for: 'MIGUEL SANTOS', special: '', type_id: 'anniversary',
    date: '2027-01-20', time: '[Mass time 3]', confirmed_date: '2027-01-20', confirmed_time: '[Mass time 3]',
    status: 'approved', submitted_at: '2026-11-12T08:40:00',
    payment: { ...mPay3, proof: mockProof(0, { sender_account_name: 'ROSA DIAZ', sender_gcash_number: '0917 000 1122' }, 203, '2026-11-12T08:40:00') } },
];