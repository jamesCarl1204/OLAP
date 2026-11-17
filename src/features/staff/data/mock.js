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

// TODO: seed from API — empty until real backend is connected
export const REQUESTS = [];

// TODO: seed from API
export const EVENTS = {};

// TODO: seed from API
export const REGISTRY = [];

// TODO: seed from API
export const MARRIAGES = [];

// TODO: seed from API
export const EMAILS = [];

export const peso = (n) => `₱${Number(n).toFixed(2)}`;
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export const fmtLong = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

// TODO: seed from API
export const ISSUED = {};

// Fake GCash receipt image so the proof viewer has something to show.
// In the real system this is the uploaded file (files table, storage_key).


// =====================================================================
// Baptism Registration + Mass Intention (staff side)
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

// TODO: seed from API
export const BAPTISMS = [];

// TODO: seed from API
export const MASSES = [];