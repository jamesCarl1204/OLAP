import { ymd } from '../utils/format.js';
import { listRequestRows, listRequestEvents, listIssuedRows, listLinkedRecords, listEmailRows } from '../models/requestModel.js';
import { listBaptismRows, listSponsorRows, listDocumentRows, listBaptismEvents } from '../models/baptismModel.js';
import { listMassRows, listMassEvents } from '../models/massModel.js';
import { searchRecords } from '../models/registryModel.js';

const MARRIAGE_LABEL = { catholic: 'Catholic', non_catholic: 'Non-Catholic', civil: 'Civil' };
const DOC_KEY = { birth_certificate: 'birth', marriage_contract: 'marriage', no_record: 'noRecord' };

const fileUrl = (id) => `/api/staff/files/${id}`;
const kb = (bytes) => Math.max(1, Math.round(bytes / 1024));

// events grouped by key: (row) => key
function groupEvents(rows, keyOf) {
  const out = {};
  for (const e of rows) (out[keyOf(e)] ||= []).push({ note: e.note, actor: e.full_name || 'Requester', at: e.created_at });
  return out;
}

const toRecord = (g) => ({
  id: g.id, full_name: g.full_name, father_name: g.father_name, mother_name: g.mother_name,
  birth_date: g.birth_date, birth_place: g.birth_place, event_date: g.event_date, officiant: g.officiant,
  sponsors: g.sponsors ? g.sponsors.split(';').map((s) => s.trim()).filter(Boolean) : [],
  book_no: g.book_no, page_no: g.page_no, line_no: g.line_no,
});

const toRequest = (r) => ({
  id: r.id, reference_no: r.reference_no, certificate_type: r.certificate_type, format: r.format, status: r.status,
  subject_name: r.subject_name, father_name: r.father_name, mother_name: r.mother_name,
  birth_date: r.birth_date, birth_place: r.birth_place, event_date: r.event_date, purpose: r.purpose,
  destination_church: r.destination_church, destination_city: r.destination_city,
  requester_name: r.requester_name, contact_email: r.contact_email, contact_phone: r.contact_phone,
  fee_amount: Number(r.fee_amount), submitted_at: r.submitted_at, consent_at: r.consent_at,
  duplicates: Number(r.dupes),
  payment: {
    method: r.pay_method, status: r.pay_status,
    sender_gcash_number: r.sender_gcash_number, sender_account_name: r.sender_account_name,
    reject_reason: r.pay_reject_reason,
    proof: r.proof_id ? {
      type: r.mime_type?.startsWith('image/') ? 'image' : 'pdf',
      url: fileUrl(r.proof_id), name: r.original_name, size_kb: kb(r.size_bytes),
      uploaded_at: r.proof_uploaded_at, duplicate: Number(r.proof_dupes) > 0,
    } : null,
  },
});

export async function listRequestsForStaff() {
  const [rows, evts, iss, recs, mails] = await Promise.all([
    listRequestRows(), listRequestEvents(), listIssuedRows(), listLinkedRecords(), listEmailRows(),
  ]);

  const issued = {};
  for (const i of iss) issued[i.request_id] = {
    certificate_no: i.certificate_no, verify_token: i.verify_token, signed_by: i.signed_by, issued_at: i.issued_at,
    pdf_url: i.pdf_file_id ? fileUrl(i.pdf_file_id) : null,
  };

  const records = {};
  for (const g of recs) records[g.request_id] = toRecord(g);

  return {
    requests: rows.map(toRequest),
    events: groupEvents(evts, (e) => e.ref_id),
    issued, records, emails: mails,
  };
}

export async function searchRegistryForStaff(type, q) {
  if (!['baptism', 'confirmation'].includes(type)) return { records: [] };
  const safe = String(q ?? '').trim().slice(0, 100).replace(/[\\%_]/g, '\\$&');
  const rows = await searchRecords(type, `%${safe}%`);
  return { records: rows.map(toRecord) };
}

export async function listBaptismsForStaff() {
  const [rows, spons, docs, evts] = await Promise.all([
    listBaptismRows(), listSponsorRows(), listDocumentRows(), listBaptismEvents(),
  ]);

  const sponsorsOf = {};
  for (const s of spons) (sponsorsOf[s.baptism_id] ||= []).push({ name: s.full_name, address: s.address });

  const filesOf = {};
  for (const d of docs) (filesOf[d.baptism_id] ||= []).push({
    key: DOC_KEY[d.doc_type], name: d.original_name, url: fileUrl(d.file_id),
  });

  const baptisms = rows.map((r) => ({
    id: r.id, reference_no: r.reference_no, type_id: r.type_code, status: r.status,
    date: ymd(r.requested_date), time: r.requested_time,
    confirmed_date: ymd(r.confirmed_date) || ymd(r.requested_date),
    confirmed_time: r.confirmed_time || r.requested_time,
    child: { given: r.child_given, middle: r.child_middle, surname: r.child_surname, dob: ymd(r.child_birth_date), pob: r.child_birth_place },
    father: { name: r.father_name, pob: r.father_birth_place },
    mother: { name: r.mother_name, pob: r.mother_birth_place },
    marriage_kind: MARRIAGE_LABEL[r.marriage_kind], venue: r.marriage_venue, address: r.parents_address,
    email: r.contact_email, phone: r.contact_phone,
    married_legally: !!r.married_legally, late_birth_reg: !!r.late_birth_reg, parent_name: r.parent_print_name,
    sponsors: sponsorsOf[r.id] || [], files: filesOf[r.id] || [],
    fee_total: Number(r.fee_total), reject_reason: r.reject_reason, submitted_at: r.submitted_at,
    payment: {
      method: r.pay_method, status: r.pay_status,
      sender_gcash_number: r.sender_gcash_number, sender_account_name: r.sender_account_name,
      reject_reason: r.pay_reject_reason,
      proof: r.proof_id ? {
        type: r.proof_mime?.startsWith('image/') ? 'image' : 'pdf',
        url: fileUrl(r.proof_id), name: r.proof_name, size_kb: kb(r.proof_size), uploaded_at: r.proof_uploaded_at,
      } : null,
    },
    staff: {
      priest: r.baptized_by, received_by: r.received_by_name,
      book: r.book_no, page: r.page_no, line: r.line_no, stipend: r.stipend_received,
    },
  }));

  return { baptisms, events: groupEvents(evts, (e) => `b${e.ref_id}`) };
}

// Staff UI uses these payment labels for Mass Intentions.
const massPayStatus = (method, status) => {
  if (status === 'verified') return 'paid';
  if (status === 'rejected') return 'rejected';
  return method === 'gcash' ? 'for_verification' : 'pending_payment';
};

export async function listMassesForStaff() {
  const [rows, evts] = await Promise.all([listMassRows(), listMassEvents()]);

  const masses = rows.map((r) => ({
    id: r.id, reference_no: r.reference_no, type_id: r.type_code, status: r.status,
    requestor: r.requestor_name, phone: r.contact_phone, email: r.contact_email,
    prayed_for: r.prayed_for, special: r.special_requests,
    date: ymd(r.requested_date), time: r.requested_time,
    confirmed_date: ymd(r.confirmed_date) || ymd(r.requested_date),
    confirmed_time: r.confirmed_time || r.requested_time,
    reject_reason: r.reject_reason, submitted_at: r.submitted_at,
    payment: {
      method: r.pay_method, status: massPayStatus(r.pay_method, r.pay_status),
      gcash_ref: r.gcash_reference_no, reject_reason: r.pay_reject_reason,
      proof: r.proof_id ? {
        type: r.proof_mime?.startsWith('image/') ? 'image' : 'pdf',
        url: fileUrl(r.proof_id), name: r.proof_name, size_kb: kb(r.proof_size), uploaded_at: r.proof_uploaded_at,
      } : null,
    },
  }));

  return { masses, events: groupEvents(evts, (e) => `m${e.ref_id}`) };
}