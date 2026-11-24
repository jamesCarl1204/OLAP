// Staff data store — connected to the backend API for certificate requests, baptism registrations, and Mass Intentions.
// Staff actions for baptism and Mass stay stub until their endpoints are built.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { CERT_LABELS, peso } from './mock.js';
import { BAPTISM_TYPES, MASS_TYPES } from '../../../data/certificates.js';

export const TYPE_KEY = { baptismal: 'baptism', confirmation: 'confirmation', marriage: 'marriage', no_record_baptism: 'baptism', no_record_confirmation: 'confirmation' };

// ---- reactive state ----
let state = {
  requests: [], baptisms: [], masses: [], events: {}, records: {}, issued: {}, emails: [],
  loading: false, error: '',
};
const listeners = new Set();
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const setState = (patch) => { state = { ...state, ...patch }; listeners.forEach((fn) => fn()); };
let started = false;

// Events are keyed differently per module (request id, "b<id>", "m<id>"). Kept apart so one refresh never wipes another.
let certEvents = {};
let bapEvents = {};
let massEvents = {};
const allEvents = () => ({ ...certEvents, ...bapEvents, ...massEvents });

export async function refreshStaff() {
  setState({ loading: true, error: '' });
  try {
    const res = await fetch('/api/staff/requests', { credentials: 'include' });
    if (res.status === 401) { window.location.assign('/login'); return; }
    if (!res.ok) throw new Error('request failed');
    const d = await res.json();
    certEvents = d.events;
    setState({ requests: d.requests, events: allEvents(), issued: d.issued, records: d.records, emails: d.emails, loading: false });
  } catch {
    setState({ loading: false, error: 'Cannot load requests from the server.' });
  }
}

export async function refreshBaptisms() {
  try {
    const res = await fetch('/api/staff/baptisms', { credentials: 'include' });
    if (res.status === 401) { window.location.assign('/login'); return; }
    if (!res.ok) throw new Error('request failed');
    const d = await res.json();
    bapEvents = d.events;
    setState({ baptisms: d.baptisms, events: allEvents() });
  } catch {
    setState({ error: 'Cannot load baptism registrations from the server.' });
  }
}

export async function refreshMasses() {
  try {
    const res = await fetch('/api/staff/masses', { credentials: 'include' });
    if (res.status === 401) { window.location.assign('/login'); return; }
    if (!res.ok) throw new Error('request failed');
    const d = await res.json();
    massEvents = d.events;
    setState({ masses: d.masses, events: allEvents() });
  } catch {
    setState({ error: 'Cannot load Mass Intentions from the server.' });
  }
}

export function useStaff() {
  const s = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    if (!started) { started = true; refreshStaff(); refreshBaptisms(); refreshMasses(); }
  }, []);
  return s;
}

// Registry search for the record check (debounced).
export function useRegistrySearch(type, q, enabled) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!enabled) return undefined;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/staff/registry?type=${type}&q=${encodeURIComponent(q.trim())}`, { credentials: 'include', signal: ctl.signal });
        if (res.ok) setRows((await res.json()).records);
      } catch { /* aborted or offline */ }
    }, 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [type, q, enabled]);
  return rows;
}

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
async function act(id, action, body = {}) {
  try {
    const res = await fetch(`/api/staff/requests/${id}/${action}`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { window.location.assign('/login'); return false; }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) window.alert(data.message || 'Action failed.');
    await refreshStaff();
    return res.ok;
  } catch {
    window.alert('Cannot reach the server. Nothing was changed.');
    return false;
  }
}

const ask = (msg) => { const v = window.prompt(msg); return v && v.trim() ? v.trim() : null; };

const unavailable = () => {
  if (typeof window !== 'undefined') {
    window.alert('This action is unavailable because the parish backend is not connected for this service yet. No changes were saved and no email was sent.');
  }
};

export const actions = {
  // certificate requests (connected)
  start: (id) => act(id, 'start'),
  resume: (id) => act(id, 'resume'),
  hold: (id, reason) => { const r = reason ?? ask('Reason for putting this request on hold (emailed to the requester):'); return r && act(id, 'hold', { reason: r }); },
  reject: (id) => { const r = ask('Reason for rejecting this request (emailed to the requester):'); return r && act(id, 'reject', { reason: r }); },
  verifyPayment: (id) => act(id, 'verify-payment'),
  rejectPayment: (id, reason) => act(id, 'reject-payment', { reason }),
  confirmRecord: (id, m) => act(id, 'confirm-record', { registry_record_id: m.id }),
  noRecord: (id) => act(id, 'no-record'),
  confirmNoRecord: (id) => act(id, 'confirm-no-record'),
  generate: (id, signedBy) => act(id, 'generate', { signed_by: signedBy }),
  sendEmail: (id, kind, mail) => act(id, kind === 'certificate' ? 'send-email' : 'notify-pickup', { subject: mail.subject, body: mail.body }),
  release: (id) => { const n = ask('Name of the person who claimed the certificate (valid ID checked):'); return n && act(id, 'release', { claimed_by: n }); },
  retryEmail: unavailable,

  // baptism registration and mass intention staff actions (not connected yet)
  createBaptism: unavailable, verifyBaptismPayment: unavailable, rejectBaptismPayment: unavailable,
  holdBaptism: unavailable, resumeBaptism: unavailable, approveBaptism: unavailable,
  rejectBaptism: unavailable, completeBaptism: unavailable,
  createMass: unavailable, markMassPaid: unavailable, rejectMassPayment: unavailable,
  approveMass: unavailable, rejectMass: unavailable, completeMass: unavailable,
};