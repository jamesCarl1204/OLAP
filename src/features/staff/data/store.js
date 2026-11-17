// Tiny in-memory store so every staff page sees the same data while we have no backend.
// TODO: replace each action with an API call (PATCH /requests/:id/..., POST /certificates, POST /emails/send).
import { useSyncExternalStore } from 'react';
import { REQUESTS, EVENTS, ISSUED, REGISTRY, EMAILS, STATUS, CERT_LABELS, peso, PARISH_PRIEST, BAPTISMS, MASSES } from './mock.js';
import { BAPTISM_TYPES, MASS_TYPES } from '../../../data/certificates.js';

export const TYPE_KEY = { baptismal: 'baptism', confirmation: 'confirmation', marriage: 'marriage', no_record_baptism: 'baptism', no_record_confirmation: 'confirmation' };

const autoRecord = (r) =>
  REGISTRY.find((x) => x.record_type === TYPE_KEY[r.certificate_type] && x.full_name === r.subject_name) || null;

function initial() {
  const requests = REQUESTS.map((r) => ({ ...r, payment: { ...r.payment } }));
  const baptisms = BAPTISMS.map((b) => ({ ...b, payment: { ...b.payment }, staff: { ...b.staff } }));
  const masses = MASSES.map((m) => ({ ...m, payment: { ...m.payment } }));
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
  baptisms.forEach((b) => { events[`b${b.id}`] = [{ type: 'submitted', note: 'Registration submitted by parent.', actor: 'Requester', at: b.submitted_at }]; });
  masses.forEach((m) => { events[`m${m.id}`] = [{ type: 'submitted', note: 'Request submitted by requester.', actor: 'Requester', at: m.submitted_at }]; });
  return { requests, baptisms, masses, events, records, issued: { ...ISSUED }, emails: EMAILS.map((e) => ({ ...e })) };
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

// generic versions for baptism / mass (list = 'baptisms' | 'masses', key = 'b1' / 'm1' in events)
const patchIn = (s, list, id, patch) => ({
  ...s,
  [list]: s[list].map((x) => (x.id === id ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x)),
});
const queueMail = (s, item, kind, template_key, subject) => ({
  ...s,
  emails: [{ id: Date.now() + Math.random(), request_id: item.id, kind, reference_no: item.reference_no,
    to_email: item.email || item.phone, template_key, subject, status: 'sent', attempts: 1, last_error: null,
    queued_at: new Date().toISOString() }, ...s.emails],
});
const nextRef = (s) => {
  const nums = [...s.requests, ...s.baptisms, ...s.masses].map((x) => parseInt(x.reference_no.slice(-5), 10) || 0);
  return `OLAP-${new Date().getFullYear()}-${String(Math.max(0, ...nums) + 1).padStart(5, '0')}`;
};
const toFile = (key, label, f) => f && ({
  key, label, name: f.name, type: f.type === 'application/pdf' ? 'pdf' : 'image',
  size_kb: Math.round(f.size / 1024), uploaded_at: new Date().toISOString(), url: URL.createObjectURL(f),
});
const longDay = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—');
const SIGN = '\n\nThank you!\nOUR LADY OF THE AIRWAYS PARISH';

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

export function buildBaptismEmail(b, kind, sched, reason) {
  const type = BAPTISM_TYPES.find((t) => t.id === b.type_id);
  const s = sched || { date: b.confirmed_date, time: b.confirmed_time };
  const child = [b.child.given, b.child.middle, b.child.surname].filter(Boolean).join(' ');
  if (kind === 'rejected') {
    return { to: b.email, subject: 'Your Baptism Request Could Not Be Approved', attachment: null,
      body: `Hello, ${b.parent_name}!\n\nYour Baptism request for ${child} (${b.reference_no}) could not be approved.\n\nReason: ${reason}\n\nNO REQUIREMENTS, NO BAPTISM. Please contact the parish office.${SIGN}` };
  }
  return {
    to: b.email, subject: 'Your Baptism Schedule Is Confirmed', attachment: null,
    body: `Hello, ${b.parent_name}!\n\nYour Baptism request for ${child} has been approved.\n\nSchedule: ${longDay(s.date)}, ${s.time} (${type?.title})\nRequest Reference Number: ${b.reference_no}\n\nPlease arrive at least one (1) hour before the scheduled baptism.\nOn the day of the baptism, please bring the hard copies (xerox) of all the requirements and your payment receipt for verification.${SIGN}`,
  };
}

export function buildMassEmail(m, kind, sched, reason) {
  const type = MASS_TYPES.find((t) => t.id === m.type_id);
  const s = sched || { date: m.confirmed_date, time: m.confirmed_time };
  const to = m.email || m.phone;
  if (kind === 'rejected') {
    return { to, subject: 'Your Mass Intention Request Could Not Be Approved', attachment: null,
      body: `Hello, ${m.requestor}!\n\nYour Mass Intention request (${m.reference_no}) was not accepted.\n\nReason: ${reason}\n\nPlease contact the Parish Office.${SIGN}` };
  }
  return {
    to, subject: 'Your Mass Intention Is Confirmed', attachment: null,
    body: `Hello, ${m.requestor}!\n\nYour Mass Intention request has been approved by the Parish Office.\n\nRequest Reference Number: ${m.reference_no}\nName of Requestor: ${m.requestor}\nName of Person to be Prayed For: ${m.prayed_for}\nType of Mass Intention: ${type?.title}\nConfirmed Date of Mass: ${longDay(s.date)}\nConfirmed Mass Schedule: ${s.time}\nPayment Method: ${m.payment.method === 'gcash' ? 'GCash' : 'Cash'}\nPayment Status: Paid\nRequest Status: Approved${SIGN}`,
  };
}

// ---- actions ----
export const actions = {
  // ===== certificate requests =====
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

  // ===== BAPTISM REGISTRATION =====
  // Called by the public form. Returns the reference number.
  createBaptism({ typeId, date, time, form, files, pay, total }) {
    const reference_no = nextRef(state);
    const id = Math.max(0, ...state.baptisms.map((b) => b.id)) + 1;
    const gcash = pay.method === 'gcash';
    const rec = {
      id, reference_no, type_id: typeId, date, time, confirmed_date: date, confirmed_time: time,
      status: 'pending', submitted_at: new Date().toISOString(), fee_total: total,
      child: { surname: form.surname, given: form.given, middle: form.middle, dob: form.dob, pob: form.pob },
      father: { name: form.father, pob: form.fatherPob }, mother: { name: form.mother, pob: form.motherPob },
      marriage_kind: form.marriageKind, venue: form.venue, address: form.address,
      sponsors: form.sponsors, email: form.email, phone: form.phone, parent_name: form.parentName,
      married_legally: form.marriedLegally, late_birth_reg: form.lateBirthReg,
      files: [toFile('birth', 'Birth Certificate', files.birth), toFile('marriage', 'Marriage Contract', files.marriage), toFile('noRecord', 'Certificate of No Record', files.noRecord)].filter(Boolean),
      payment: {
        method: pay.method, status: gcash ? 'pending' : 'paid_on_pickup',
        sender_gcash_number: pay.gcashNumber, sender_account_name: pay.gcashName,
        proof: gcash ? toFile('proof', 'Proof of payment', pay.proof) : null,
      },
      staff: { priest: '', book: '', page: '', line: '', stipend: '', received_by: '' },
    };
    update((s) => ({
      ...s, baptisms: [rec, ...s.baptisms],
      events: { ...s.events, [`b${id}`]: [{ type: 'submitted', note: 'Registration submitted by parent.', actor: 'Requester', at: rec.submitted_at }] },
    }));
    return reference_no;
  },
  verifyBaptismPayment(id) {
    update((s) => addEvent(patchIn(s, 'baptisms', id, (b) => ({ payment: { ...b.payment, status: 'verified', reject_reason: null } })), `b${id}`, 'payment_verified', 'GCash payment verified.'));
  },
  rejectBaptismPayment(id, reason) {
    update((s) => {
      const b = s.baptisms.find((x) => x.id === id);
      let n = patchIn(s, 'baptisms', id, (x) => ({ status: 'on_hold', payment: { ...x.payment, status: 'rejected', reject_reason: reason } }));
      n = addEvent(n, `b${id}`, 'payment_rejected', `Payment rejected: ${reason}`);
      n = queueMail(n, b, 'baptism', 'payment_rejected', 'Payment could not be verified');
      return addEvent(n, `b${id}`, 'email_sent', 'Email sent: payment rejected.');
    });
  },
  holdBaptism(id) { update((s) => addEvent(patchIn(s, 'baptisms', id, { status: 'on_hold' }), `b${id}`, 'status_changed', 'Put on hold.')); },
  resumeBaptism(id) { update((s) => addEvent(patchIn(s, 'baptisms', id, { status: 'pending' }), `b${id}`, 'status_changed', 'Resumed review.')); },
  approveBaptism(id, sched) {
    update((s) => {
      const b = s.baptisms.find((x) => x.id === id);
      let n = patchIn(s, 'baptisms', id, { status: 'approved', confirmed_date: sched.date, confirmed_time: sched.time });
      n = queueMail(n, b, 'baptism', 'baptism_confirmed', 'Your Baptism Schedule Is Confirmed');
      n = addEvent(n, `b${id}`, 'status_changed', `Approved. Schedule confirmed: ${sched.date} ${sched.time}.`);
      return addEvent(n, `b${id}`, 'email_sent', `Confirmation emailed to ${b.email}.`);
    });
  },
  rejectBaptism(id, reason) {
    update((s) => {
      const b = s.baptisms.find((x) => x.id === id);
      let n = patchIn(s, 'baptisms', id, { status: 'rejected', reject_reason: reason });
      n = queueMail(n, b, 'baptism', 'baptism_rejected', 'Your Baptism Request Could Not Be Approved');
      n = addEvent(n, `b${id}`, 'status_changed', `Rejected: ${reason}`);
      return addEvent(n, `b${id}`, 'email_sent', `Email sent to ${b.email}.`);
    });
  },
  completeBaptism(id, info) {
    update((s) => addEvent(patchIn(s, 'baptisms', id, { status: 'completed', staff: { ...info } }), `b${id}`, 'issued', 'Baptism completed. Register details saved.'));
  },

  // ===== MASS INTENTION =====
  // Called by the public form. Returns the reference number.
  createMass({ typeId, date, time, form, pay }) {
    const reference_no = nextRef(state);
    const id = Math.max(0, ...state.masses.map((m) => m.id)) + 1;
    const gcash = pay.method === 'gcash';
    const rec = {
      id, reference_no, requestor: form.requestor, phone: form.phone, email: form.email,
      prayed_for: form.prayedFor, special: form.special, type_id: typeId,
      date, time, confirmed_date: date, confirmed_time: time, status: 'pending', submitted_at: new Date().toISOString(),
      payment: { method: pay.method, status: gcash ? 'for_verification' : 'pending_payment', gcash_ref: pay.gcashRef, proof: gcash ? toFile('proof', 'GCash receipt', pay.proof) : null },
    };
    update((s) => ({
      ...s, masses: [rec, ...s.masses],
      events: { ...s.events, [`m${id}`]: [{ type: 'submitted', note: 'Request submitted by requester.', actor: 'Requester', at: rec.submitted_at }] },
    }));
    return reference_no;
  },
  markMassPaid(id) {
    update((s) => addEvent(patchIn(s, 'masses', id, (m) => ({ payment: { ...m.payment, status: 'paid', reject_reason: null } })), `m${id}`, 'payment_verified', 'Payment recorded as paid.'));
  },
  rejectMassPayment(id, reason) {
    update((s) => addEvent(patchIn(s, 'masses', id, (m) => ({ payment: { ...m.payment, status: 'rejected', reject_reason: reason } })), `m${id}`, 'payment_rejected', `Payment rejected: ${reason}`));
  },
  approveMass(id, sched) {
    update((s) => {
      const m = s.masses.find((x) => x.id === id);
      let n = patchIn(s, 'masses', id, { status: 'approved', confirmed_date: sched.date, confirmed_time: sched.time });
      n = queueMail(n, m, 'mass', 'mass_confirmed', 'Your Mass Intention Is Confirmed');
      n = addEvent(n, `m${id}`, 'status_changed', `Approved. Mass confirmed: ${sched.date} ${sched.time}.`);
      return addEvent(n, `m${id}`, 'email_sent', `Confirmation sent to ${m.email || m.phone}.`);
    });
  },
  rejectMass(id, reason) {
    update((s) => {
      const m = s.masses.find((x) => x.id === id);
      let n = patchIn(s, 'masses', id, { status: 'rejected', reject_reason: reason });
      n = queueMail(n, m, 'mass', 'mass_rejected', 'Your Mass Intention Request Could Not Be Approved');
      return addEvent(n, `m${id}`, 'status_changed', `Rejected: ${reason}`);
    });
  },
  completeMass(id) {
    update((s) => addEvent(patchIn(s, 'masses', id, { status: 'completed' }), `m${id}`, 'issued', 'Mass Intention included in the celebrated Mass. Completed.'));
  },
};