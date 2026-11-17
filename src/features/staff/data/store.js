// Backend-ready staff data access placeholder.
// No sample records or in-memory mutations are used before the API is connected.
import { CERT_LABELS, peso } from './mock.js';
import { BAPTISM_TYPES, MASS_TYPES } from '../../../data/certificates.js';

export const TYPE_KEY = { baptismal: 'baptism', confirmation: 'confirmation', marriage: 'marriage', no_record_baptism: 'baptism', no_record_confirmation: 'confirmation' };

const EMPTY_STATE = {
  requests: [],
  baptisms: [],
  masses: [],
  events: {},
  records: {},
  issued: {},
  emails: [],
};

export const useStaff = () => EMPTY_STATE;

// ---- helpers ----
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
      body: `Dear ${req.requester_name},\n\nThank you for your request. Attached is the e-certificate for ${req.subject_name}.\n\nCertificate no.: ${issued?.certificate_no}\nA verification link will be provided once the parish backend is connected.${sign}`,
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

// ---- backend-dependent actions ----
// Keep the staff UI intact, but never simulate database writes, approvals,
// payment verification, certificate issuance, or email delivery.
const unavailable = () => {
  if (typeof window !== 'undefined') {
    window.alert('This action is unavailable because the parish backend is not connected. No changes were saved and no email was sent.');
  }
};

export const actions = {
  move: unavailable,
  verifyPayment: unavailable,
  rejectPayment: unavailable,
  confirmNoRecord: unavailable,
  confirmRecord: unavailable,
  noRecord: unavailable,
  generate: unavailable,
  sendEmail: unavailable,
  release: unavailable,
  retryEmail: unavailable,

  createBaptism: unavailable,
  verifyBaptismPayment: unavailable,
  rejectBaptismPayment: unavailable,
  holdBaptism: unavailable,
  resumeBaptism: unavailable,
  approveBaptism: unavailable,
  rejectBaptism: unavailable,
  completeBaptism: unavailable,

  createMass: unavailable,
  markMassPaid: unavailable,
  rejectMassPayment: unavailable,
  approveMass: unavailable,
  rejectMass: unavailable,
  completeMass: unavailable,
};
