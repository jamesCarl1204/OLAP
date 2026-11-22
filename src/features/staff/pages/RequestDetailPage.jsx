import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import ProofModal from '../components/ProofModal.jsx';
import CertificateModal from '../components/CertificateModal.jsx';
import { useStaff, useRegistrySearch, actions, TYPE_KEY } from '../data/store.js';
import { STATUS, PAYMENT_STATUS, CERT_LABELS, peso, fmtDate, fmtDateTime } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

const FINAL = ['released', 'sent', 'rejected'];

function stepIndex(r) {
  if (r.status === 'rejected') return -1;
  if (r.status === 'on_hold') return r.payment.status === 'rejected' ? 1 : 2;
  return { submitted: 0, payment_check: 1, record_check: 2, ready: 3, released: 4, sent: 4 }[r.status];
}

function KV({ label, value }) {
  return <div><small>{label}</small><strong>{value || '—'}</strong></div>;
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const rid = Number(id);
  const { requests, events, issued, records } = useStaff();
  const req = requests.find((r) => r.id === rid);

  const [rq, setRq] = useState(req ? req.subject_name : '');
  const [proofOpen, setProofOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [done, setDone] = useState({});

  const matches = useRegistrySearch(req ? TYPE_KEY[req.certificate_type] : '', rq, req?.status === 'record_check');

  if (!req) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>Request not found.</p>
        <Link to="/staff/requests" className={styles.back}><i className="fa-solid fa-arrow-left" /> Back to requests</Link>
      </div>
    );
  }

  const pay = req.payment;
  const digital = req.format === 'digital';
  const gcash = pay.method === 'gcash';
  const noRec = req.certificate_type.startsWith('no_record');
  const iss = issued[rid];
  const record = records[rid];
  const idx = stepIndex(req);
  const STEPS = ['Submitted', 'Payment', 'Record', 'Certificate', digital ? 'Sent' : 'Released'];
  const isDone = (i) => i < idx || (idx === 4 && i === 4);

  const checklist = checklistFor(req.certificate_type);
  const reviewed = !checklist || checklist.every((i) => done[i.key]);

  return (
    <>
      <Link to="/staff/requests" className={styles.back}><i className="fa-solid fa-arrow-left" /> All requests</Link>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">{CERT_LABELS[req.certificate_type]} Certificate · {digital ? 'Digital (email)' : 'Hardcopy (pickup)'}</span>
          <h1>{req.reference_no}</h1>
          <p>Submitted {fmtDateTime(req.submitted_at)}</p>
        </div>
        <Badge tone={STATUS[req.status].tone}>{STATUS[req.status].label}</Badge>
      </div>

      <ol className={styles.stepper} aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`${i === idx ? styles.cur : ''} ${isDone(i) ? styles.done : ''}`}>
            <b>{isDone(i) ? <i className="fa-solid fa-check" /> : i + 1}</b><span>{s}</span>
          </li>
        ))}
      </ol>

      {req.duplicates > 0 && (
        <p className={styles.note} style={{ marginBottom: '1rem' }}>
          <b>Possible duplicate:</b> {req.duplicates} other request(s) with the same name, type, and email.
        </p>
      )}
      {pay.proof?.duplicate && (
        <p className={styles.note} style={{ marginBottom: '1rem' }}>
          <b>Warning:</b> this exact proof file was already used in another request.
        </p>
      )}

      <div className={styles.cols}>
        <div className={styles.stack}>
          <div className={styles.card}>
            <h2><i className="fa-solid fa-user" /> Person on the certificate</h2>
            <div className={styles.kv}>
              <KV label="Full name" value={req.subject_name} />
              <KV label="Purpose" value={req.purpose} />
              <KV label="Father" value={req.father_name} />
              <KV label="Mother (maiden)" value={req.mother_name} />
              <KV label="Date of birth" value={req.birth_date && fmtDate(req.birth_date)} />
              <KV label="Place of birth" value={req.birth_place} />
              <KV label="Date of event" value={req.event_date && fmtDate(req.event_date)} />
              {noRec && <KV label="Destination church" value={`${req.destination_church}, ${req.destination_city}`} />}
              <KV label="Format" value={digital ? 'Digital · sent by email' : 'Hardcopy · pickup at parish office'} />
            </div>
            <h2 style={{ marginTop: '1.25rem' }}><i className="fa-solid fa-address-book" /> Requester</h2>
            <div className={styles.kv}>
              <KV label="Name" value={req.requester_name} />
              <KV label="Email" value={req.contact_email} />
              <KV label="Phone" value={req.contact_phone} />
            </div>
          </div>

          {/* REVIEW SUBMISSION (baptismal only for now) */}
          <SubmissionReview req={req} done={done} setDone={setDone} locked={req.status !== 'submitted'} />

          {/* PAYMENT */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2><i className="fa-solid fa-money-check-dollar" /> Payment</h2>
              <Badge tone={PAYMENT_STATUS[pay.status].tone}>{PAYMENT_STATUS[pay.status].label}</Badge>
            </div>
            <div className={styles.kv}>
              <KV label="Amount" value={peso(req.fee_amount)} />
              <KV label="Method" value={gcash ? 'GCash' : 'Pay upon pickup'} />
              {gcash && <>
                <KV label="Sender GCash no." value={pay.sender_gcash_number} />
                <KV label="Sender account name" value={pay.sender_account_name} />
              </>}
            </div>

            {gcash && pay.proof && (
              <div className={styles.proof}>
                <button type="button" className={styles.thumb} onClick={() => setProofOpen(true)} aria-label="View proof of payment">
                  {pay.proof.type === 'image' ? <img src={pay.proof.url} alt="Proof of payment" /> : <i className="fa-solid fa-file-pdf" />}
                </button>
                <div>
                  <strong>{pay.proof.name}</strong>
                  <small>{pay.proof.type.toUpperCase()} · {pay.proof.size_kb} KB · uploaded {fmtDateTime(pay.proof.uploaded_at)}</small>
                  <button type="button" className={styles.link} style={{ cursor: 'pointer' }} onClick={() => setProofOpen(true)}>
                    <i className="fa-solid fa-eye" /> {req.status === 'payment_check' ? 'Review proof & verify' : 'View proof of payment'}
                  </button>
                </div>
              </div>
            )}
            {pay.reject_reason && <p className={styles.note} style={{ marginTop: '1rem' }}><b>Rejected:</b> {pay.reject_reason}</p>}
            {!gcash && <p className={styles.note} style={{ marginTop: '1rem' }}>No online payment. Collect {peso(req.fee_amount)} at the parish office when the certificate is claimed.</p>}
          </div>

          {/* RECORD CHECK */}
          <div className={styles.card}>
            <h2><i className="fa-solid fa-book-bible" /> Record check</h2>
            {req.status === 'record_check' ? (
              <>
                <p className={styles.note}>
                  {noRec
                    ? 'Search the registry. If a matching record exists, do not issue a No Record certificate.'
                    : `Search the ${TYPE_KEY[req.certificate_type]} registry and pick the matching record.`}
                </p>
                <div className={styles.search} style={{ marginTop: '0.875rem' }}>
                  <i className="fa-solid fa-magnifying-glass" />
                  <input className={styles.input} value={rq} onChange={(e) => setRq(e.target.value)} placeholder="Search full name" />
                </div>
                <div className={styles.matches}>
                  {matches.length === 0 && <p className={styles.empty}>No matching record.</p>}
                  {matches.map((m) => (
                    <div key={m.id} className={styles.match}>
                      <div>
                        <strong>{m.full_name}</strong>
                        <small>{m.father_name} &amp; {m.mother_name} · {fmtDate(m.event_date)} · Book {m.book_no} / Page {m.page_no} / Line {m.line_no}</small>
                      </div>
                      {!noRec && <button type="button" className={styles.btn} onClick={() => actions.confirmRecord(rid, m)}>Use this record</button>}
                    </div>
                  ))}
                </div>
                <div className={styles.row}>
                  {noRec ? (
                    <>
                      <button type="button" className={styles.btn} onClick={() => actions.confirmNoRecord(rid)}><i className="fa-solid fa-circle-check" /> No record found</button>
                      <button type="button" className={styles.btnDanger} onClick={() => actions.hold(rid, 'A record exists in the registry. Needs review.')}><i className="fa-solid fa-triangle-exclamation" /> A record exists</button>
                    </>
                  ) : (
                    <button type="button" className={styles.btnDanger} onClick={() => actions.noRecord(rid)}><i className="fa-solid fa-circle-xmark" /> No matching record</button>
                  )}
                </div>
              </>
            ) : record ? (
              <div className={styles.kv}>
                <KV label="Registry name" value={record.full_name} />
                <KV label="Book / Page / Line" value={`${record.book_no} / ${record.page_no} / ${record.line_no}`} />
                <KV label="Officiant" value={record.officiant} />
                <KV label="Date of event" value={fmtDate(record.event_date)} />
              </div>
            ) : (
              <p className={styles.note}>Record check starts once the request is accepted{gcash ? ' and the payment is verified' : ''}.</p>
            )}
          </div>

          {/* CERTIFICATE */}
          <div className={styles.card}>
            <h2><i className="fa-solid fa-stamp" /> {digital ? 'E-certificate' : 'Certificate'}</h2>
            {iss ? (
              <div className={styles.kv}>
                {digital && <KV label="Certificate no." value={iss.certificate_no} />}
                <KV label="Issued" value={fmtDateTime(iss.issued_at)} />
                <KV label="Signed by" value={iss.signed_by} />
                {digital && <KV label="Verify link" value={`olap.example/verify/${iss.verify_token}`} />}
              </div>
            ) : (
              <p className={styles.note}>{req.status === 'ready' ? (noRec ? 'No record found. Ready to generate.' : 'Record found. Ready to generate.') : 'Available once the record check is done.'}</p>
            )}
            {(iss || req.status === 'ready') && (
              <div className={styles.row}>
                <button type="button" className={styles.btn} onClick={() => setCertOpen(true)}>
                  <i className={`fa-solid ${iss ? 'fa-eye' : 'fa-file-circle-plus'}`} /> {iss ? 'View / Print / Send' : `Generate ${digital ? 'e-certificate' : 'certificate'}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SIDE */}
        <div className={styles.stack}>
          <div className={styles.card}>
            <h2><i className="fa-solid fa-bolt" /> Actions</h2>
            <div className={styles.actions}>
              {req.status === 'submitted' && (
                <button type="button" className={styles.btn} disabled={!reviewed} onClick={() => actions.start(rid)}>
                  <i className="fa-solid fa-play" /> Approve &amp; {gcash ? 'check payment' : 'check record'}
                </button>
              )}
              {req.status === 'payment_check' && <p className={styles.note}>Open the proof of payment, then verify or reject it.</p>}
              {req.status === 'record_check' && <p className={styles.note}>Find the record in the registry.</p>}
              {req.status === 'ready' && <p className={styles.note}>{iss ? (digital ? 'Send the e-certificate by email.' : 'Notify the requester, then release the hardcopy when claimed.') : 'Generate the certificate.'}</p>}
              {req.status === 'on_hold' && (
                <button type="button" className={styles.btnGhost} onClick={() => actions.resume(rid)}>
                  <i className="fa-solid fa-rotate-right" /> Resume request
                </button>
              )}
              {!FINAL.includes(req.status) && req.status !== 'on_hold' && (
                <button type="button" className={styles.btnGhost} onClick={() => actions.hold(rid)}><i className="fa-solid fa-pause" /> Put on hold</button>
              )}
              {!FINAL.includes(req.status) && (
                <button type="button" className={styles.btnDanger} onClick={() => actions.reject(rid)}><i className="fa-solid fa-ban" /> Reject request</button>
              )}
              {FINAL.includes(req.status) && <p className={styles.note}>This request is closed.</p>}
            </div>
          </div>

          <div className={styles.card}>
            <h2><i className="fa-solid fa-clock-rotate-left" /> Activity</h2>
            <ul className={styles.timeline}>
              {[...(events[rid] || [])].reverse().map((e, i) => (
                <li key={i}>{e.note}<small>{e.actor} · {fmtDateTime(e.at)}</small></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {proofOpen && <ProofModal id={rid} onClose={() => setProofOpen(false)} />}
      {certOpen && <CertificateModal id={rid} onClose={() => setCertOpen(false)} />}
    </>
  );
}