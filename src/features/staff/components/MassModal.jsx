import { useState } from 'react';
import Modal from './Modal.jsx';
import EmailModal from './EmailModal.jsx';
import Badge from './Badge.jsx';
import { useStaff, actions, buildMassEmail } from '../data/store.js';
import { MASS_STATUS, MASS_PAYMENT, fmtDate, fmtDateTime } from '../data/mock.js';
import { MASS_TYPES, MASS_TIMES } from '../../../data/certificates.js';
import styles from '../styles/Staff.module.css';

function KV({ label, value }) {
  return <div><small>{label}</small><strong>{value || '—'}</strong></div>;
}

export default function MassModal({ id, onClose }) {
  const { masses, events } = useStaff();
  const m = masses.find((x) => x.id === id);
  const [mode, setMode] = useState(null); // null | 'reject' | 'rejectPay'
  const [reason, setReason] = useState('');
  const [mailOpen, setMailOpen] = useState(false);
  const [sched, setSched] = useState({ date: m?.confirmed_date || '', time: m?.confirmed_time || '' });
  if (!m) return null;

  const type = MASS_TYPES.find((t) => t.id === m.type_id);
  const pay = m.payment;
  const gcash = pay.method === 'gcash';
  const open = m.status === 'pending';
  const paid = pay.status === 'paid';
  const canApprove = open && paid && sched.date && sched.time;

  const confirmReject = () => {
    if (!reason.trim()) return;
    if (mode === 'reject') { actions.rejectMass(id, reason.trim()); onClose(); }
    else { actions.rejectMassPayment(id, reason.trim()); setMode(null); setReason(''); }
  };

  let footer;
  if (mode) {
    footer = <>
      <button type="button" className={styles.btnGhost} onClick={() => { setMode(null); setReason(''); }}>Cancel</button>
      <button type="button" className={styles.btnDanger} disabled={!reason.trim()} onClick={confirmReject}><i className="fa-solid fa-circle-xmark" /> Confirm rejection</button>
    </>;
  } else if (open) {
    footer = <>
      <button type="button" className={styles.btnDanger} onClick={() => setMode('reject')}><i className="fa-solid fa-ban" /> Reject request</button>
      <button type="button" className={styles.btn} disabled={!canApprove} onClick={() => setMailOpen(true)}><i className="fa-solid fa-paper-plane" /> Approve &amp; send confirmation</button>
    </>;
  } else if (m.status === 'approved') {
    footer = <button type="button" className={styles.btn} onClick={() => { actions.completeMass(id); onClose(); }}><i className="fa-solid fa-circle-check" /> Mark as completed</button>;
  } else {
    footer = <button type="button" className={styles.btn} onClick={onClose}>Close</button>;
  }

  return (
    <>
      <Modal title={`Mass Intention · ${m.reference_no}`} wide onClose={onClose} footer={footer}>
        <div className={styles.left}>
          <div className={styles.cardHead}>
            <h2 style={{ fontSize: '1.3rem' }}>{type?.title}</h2>
            <Badge tone={MASS_STATUS[m.status].tone}>{MASS_STATUS[m.status].label}</Badge>
          </div>
          {m.reject_reason && m.status === 'rejected' && <p className={styles.note} style={{ marginBottom: '1rem' }}><b>Rejected:</b> {m.reject_reason}</p>}

          <h3 className={styles.sect}><i className="fa-solid fa-hands-praying" /> Intention</h3>
          <div className={styles.kv}>
            <KV label="Person to be prayed for" value={m.prayed_for} />
            <KV label="Special requests" value={m.special} />
            <KV label="Requestor" value={m.requestor} />
            <KV label="Contact" value={`${m.phone}${m.email ? ` · ${m.email}` : ''}`} />
          </div>

          <h3 className={styles.sect}><i className="fa-solid fa-calendar-days" /> Schedule</h3>
          <div className={styles.kv}><KV label="Requested" value={`${fmtDate(m.date)} · ${m.time}`} /></div>
          {open ? (
            <div className={styles.formGrid} style={{ marginTop: '0.75rem' }}>
              <label><span>Confirmed date</span><input className={styles.input} type="date" value={sched.date} onChange={(e) => setSched({ ...sched, date: e.target.value })} /></label>
              <label><span>Confirmed Mass time</span>
                <select className={styles.select} value={sched.time} onChange={(e) => setSched({ ...sched, time: e.target.value })}>
                  {MASS_TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
          ) : <div className={styles.kv} style={{ marginTop: '0.75rem' }}><KV label="Confirmed" value={`${fmtDate(m.confirmed_date)} · ${m.confirmed_time}`} /></div>}
          {open && <p className={styles.note} style={{ marginTop: '0.6rem' }}>Check that the requested Mass still has room before approving.</p>}

          <h3 className={styles.sect}><i className="fa-solid fa-money-check-dollar" /> Payment / offering</h3>
          <div className={styles.cardHead} style={{ marginBottom: '0.6rem' }}>
            <strong>{gcash ? 'GCash' : 'Cash at the Parish Office'}</strong>
            <Badge tone={MASS_PAYMENT[pay.status].tone}>{MASS_PAYMENT[pay.status].label}</Badge>
          </div>
          {gcash && <div className={styles.kv}><KV label="GCash reference no." value={pay.gcash_ref} /></div>}
          {pay.reject_reason && <p className={styles.note} style={{ marginTop: '0.6rem' }}><b>Rejected:</b> {pay.reject_reason}</p>}
          {gcash && pay.proof && <p style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}><i className="fa-solid fa-paperclip" /> {pay.proof.name} · <a href={pay.proof.url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-700)', fontWeight: 700 }}>View receipt</a></p>}
          {open && !paid && !mode && (
            <div className={styles.row}>
              <button type="button" className={styles.btn} onClick={() => actions.markMassPaid(id)}>
                <i className="fa-solid fa-circle-check" /> {gcash ? 'Verify payment' : 'Record cash received'}
              </button>
              {gcash && pay.status === 'for_verification' && <button type="button" className={styles.btnDanger} onClick={() => setMode('rejectPay')}><i className="fa-solid fa-circle-xmark" /> Reject payment</button>}
            </div>
          )}
          {open && !paid && <p className={styles.note} style={{ marginTop: '0.6rem' }}>Approval needs a verified payment.</p>}

          {mode && (
            <div className={styles.rejectBox}>
              <textarea autoFocus placeholder={mode === 'reject' ? 'Reason for rejecting this request' : 'Reason for rejecting the payment'} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          )}

          <h3 className={styles.sect}><i className="fa-solid fa-clock-rotate-left" /> Activity</h3>
          <ul className={styles.timeline}>
            {[...(events[`m${id}`] || [])].reverse().map((e, i) => <li key={i}>{e.note}<small>{e.actor} · {fmtDateTime(e.at)}</small></li>)}
          </ul>
        </div>
      </Modal>

      {mailOpen && (
        <EmailModal mail={buildMassEmail(m, 'approved', sched)}
          onSend={() => { actions.approveMass(id, sched); setMailOpen(false); }}
          onClose={() => setMailOpen(false)} />
      )}
    </>
  );
}