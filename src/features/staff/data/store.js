// Tiny in-memory store so every staff page sees the same data while we have no backend.
// TODO: replace each action with an API call (PATCH /requests/:id/..., POST /certificates, POST /emails/send).
import { useSyncExternalStore } from 'react';
import { REQUESTS, EVENTS, ISSUED, REGISTRY, EMAILS, STATUS, CERT_LABELS, peso, PARISH_PRIEST } from './mock.js';
export const TYPE_KEY = { baptismal: 'baptism', confirmation: 'confirmation', no_record_baptism: 'baptism', no_record_confirmation: 'confirmation' };

const autoRecord = (r) =>
  REGISTRY.find((x) => x.record_type === TYPE_KEY[r.certificate_type] && x.full_name === r.subject_name) || null;

function initial() {
  const requests = REQUESTS.map((r) => ({ ...r, payment: { ...r.payment } }));
  const events = {};
  const records = {};
  requests.forEach((r) => {
    events[r.id] = EVENTS[r.id]
      ? [...EVENTS[r.id]]
      : [{ type: 'submitted', note: 'Request submitted by requester.', actor: 'Requester', at: r.submitted_at }];
    if (['ready', 'released', 'sent'].includes(r.status)) {
      const rec = autoRecord(r);
      if (rec) records[r.id] = rec;
    }
  });
  return { requests, events, records, issued: { ...ISSUED }, emails: EMAILS.map((e) => ({ ...e })) };
}

let state = initial();
const listeners = new Set();
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const update = (fn) => { state = fn(state); listeners.forEach((l) => l()); };
export const useStaff = () => useSyncExternalStore(subscribe, () => state);

// ---- helpers ----
const patchReq = (s, id, patch) => ({
  ...s,
  requests: s.requests.map((r) => (r.id === id ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)),
});
const addEvent = (s, id, type, note) => ({
  ...s,
  events: { ...s.events, [id]: [...(s.events[id] || []), { type, note, actor: 'Parish Staff', at: new Date().toISOString() }] },
});
const queueEmail = (s, req, template_key, subject) => ({
  ...s,
  emails: [{ id: Date.now() + Math.random(), request_id: req.id, reference_no: req.reference_no, to_email: req.contact_email,
    template_key, subject, status: 'sent', attempts: 1, last_error: null, queued_at: new Date().toISOString() }, ...s.emails],
});

// ---- email templates (shown in the preview modal before sending) ----
export function buildEmail(req, issued, kind) {
  const label = CERT_LABELS[req.certificate_type];
  const sign = '\n\nGod bless,\nParish Office\nOur Lady of the Airways Parish';
  if (kind === 'certificate') {
    return {
      to: req.contact_email,
      subject: `Your ${label} E-Certificate (${req.reference_no})`,
      attachment: `${issued?.certificate_no || req.reference_no}.pdf`,
      body: `Dear ${req.requester_name},\n\nThank you for your request. Attached is the e-certificate for ${req.subject_name}.\n\nCertificate no.: ${issued?.certificate_no}\nYou can verify it by scanning the QR code on the certificate or by visiting olap.example/verify/${issued?.verify_token}.${sign}`,
    };
  }
  const due = req.payment.method === 'pickup' ? `Amount to pay upon pickup: ${peso(req.fee_amount)}.` : 'Your payment has been received.';
  return {
    to: req.contact_email,
    subject: `Your ${label} Certificate is ready for pickup (${req.reference_no})`,
    attachment: null,
    body: `Dear ${req.requester_name},\n\nYour hardcopy ${label.toLowerCase()} certificate for ${req.subject_name} is ready. Please claim it at the parish office (Tuesday – Sunday, 8:00 AM – 5:00 PM) and bring a valid ID and your reference number ${req.reference_no}.\n\n${due}${sign}`,
  };
}

// ---- actions ----
export const actions = {
  move(id, to, note) {
    update((s) => addEvent(patchReq(s, id, { status: to }), id, 'status_changed', note || `Moved to ${STATUS[to].label}.`));
  },
  verifyPayment(id) {
    update((s) => addEvent(patchReq(s, id, (r) => ({ status: 'record_check', payment: { ...r.payment, status: 'verified' } })), id, 'payment_verified', 'GCash payment verified.'));
  },
  rejectPayment(id, reason) {
    update((s) => {
      const req = s.requests.find((r) => r.id === id);
      let n = patchReq(s, id, (r) => ({ status: 'on_hold', payment: { ...r.payment, status: 'rejected', reject_reason: reason } }));
      n = addEvent(n, id, 'payment_rejected', `Payment rejected: ${reason}`);
      n = queueEmail(n, req, 'payment_rejected', 'Payment could not be verified');
      return addEvent(n, id, 'email_sent', 'Email sent: payment rejected.');
    });
  },
  confirmNoRecord(id) {
  update((s) => addEvent(patchReq(s, id, { status: 'ready' }), id, 'status_changed', 'Registry searched: no record found. Ready to issue Certificate of No Record.'));
},
  noRecord(id) {
    update((s) => addEvent(patchReq(s, id, { status: 'on_hold' }), id, 'status_changed', 'No matching record found in the registry.'));
  },
  
  generate(id, signedBy) {
    update((s) => {
      const req = s.requests.find((r) => r.id === id);
      const digital = req.format === 'digital';
      const n = String(Object.values(s.issued).filter((i) => i.certificate_no).length + 1).padStart(4, '0');
      const token = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const issued = {
        certificate_no: digital ? `OLAP-CERT-${new Date().getFullYear()}-${n}` : null,
        verify_token: digital ? token : null,
        signed_by: signedBy.trim() || PARISH_PRIEST,
        issued_by: 'Parish Staff',
        issued_at: new Date().toISOString(),
      };
      return addEvent({ ...s, issued: { ...s.issued, [id]: issued } }, id, 'issued', digital ? 'E-certificate generated.' : 'Certificate generated for printing.');
    });
  },
  sendEmail(id, kind) {
    update((s) => {
      const req = s.requests.find((r) => r.id === id);
      const mail = buildEmail(req, s.issued[id], kind);
      let n = queueEmail(s, req, kind === 'certificate' ? 'digital_certificate' : 'ready_for_pickup', mail.subject);
      if (kind === 'certificate' && req.status === 'ready') n = patchReq(n, id, { status: 'sent' });
      return addEvent(n, id, 'email_sent', kind === 'certificate' ? `E-certificate emailed to ${req.contact_email}.` : `Pickup notice emailed to ${req.contact_email}.`);
    });
  },
  release(id) {
    update((s) => addEvent(patchReq(s, id, { status: 'released' }), id, 'issued', 'Hardcopy released at the parish office.'));
  },
  retryEmail(id) {
    update((s) => ({ ...s, emails: s.emails.map((e) => (e.id === id ? { ...e, status: 'sent', attempts: e.attempts + 1, last_error: null } : e)) }));
  },
};