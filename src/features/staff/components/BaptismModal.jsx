import { useState } from 'react';
import Modal from './Modal.jsx';
import EmailModal from './EmailModal.jsx';
import Badge from './Badge.jsx';
import { useStaff, actions, buildBaptismEmail } from '../data/store.js';
import { BAPTISM_STATUS, PAYMENT_STATUS, peso, fmtDate, fmtDateTime } from '../data/mock.js';
import { BAPTISM_TYPES, EXTRA_SPONSOR_FEE } from '../../../data/certificates.js';
import styles from '../styles/Staff.module.css';

function KV({ label, value }) {
  return <div><small>{label}</small><strong>{value || '—'}</strong></div>;
}

export default function BaptismModal({ id, onClose }) {
  const { baptisms, events } = useStaff();
  const b = baptisms.find((x) => x.id === id);
  const [mode, setMode] = useState(null); // null | 'reject' | 'rejectPay'
  const [reason, setReason] = useState('');
  const [mailOpen, setMailOpen] = useState(false);
  const [sched, setSched] = useState({ date: b?.confirmed_date || '', time: b?.confirmed_time || '' });
  const [info, setInfo] = useState({ ...(b?.staff || {}) });
  if (!b) return null;

  const type = BAPTISM_TYPES.find((t) => t.id === b.type_id);
  const pay = b.payment;
  const gcash = pay.method === 'gcash';
  const child = [b.child.given, b.child.middle, b.child.surname].filter(Boolean).join(' ');
  const open = ['pending', 'on_hold'].includes(b.status);
  const locked = b.status === 'completed';

  const required = [
    { key: 'birth', label: 'Birth Certificate', need: true },
    { key: 'marriage', label: 'Marriage Contract', need: b.married_legally },
    { key: 'noRecord', label: 'Certificate of No Record', need: b.late_birth_reg },
  ];
  const fileOf = (k) => b.files.find((f) => f.key === k);
  const missing = required.filter((r) => r.need && !fileOf(r.key));
  const payOk = ['verified', 'paid_on_pickup'].includes(pay.status);
  const canApprove = open && missing.length === 0 && payOk && sched.date && sched.time;
  const extra = Math.max(0, b.sponsors.length - (type?.freeSponsors || 0));

  const confirmReject = () => {
    if (!reason.trim()) return;
    if (mode === 'reject') actions.rejectBaptism(id, reason.trim());
    else actions.rejectBaptismPayment(id, reason.trim());
    setMode(null); setReason('');
    if (mode === 'reject') onClose();
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
      {b.status === 'pending'
        ? <button type="button" className={styles.btnGhost} onClick={() => actions.holdBaptism(id)}><i className="fa-solid fa-pause" /> Put on hold</button>
        : <button type="button" className={styles.btnGhost} onClick={() => actions.resumeBaptism(id)}><i className="fa-solid fa-rotate-right" /> Resume</button>}
      <button type="button" className={styles.btn} disabled={!canApprove} onClick={() => setMailOpen(true)}><i className="fa-solid fa-paper-plane" /> Approve &amp; send email</button>
    </>;
  } else if (b.status === 'approved') {
    footer = <button type="button" className={styles.btn} onClick={() => { actions.completeBaptism(id, info); onClose(); }}><i className="fa-solid fa-circle-check" /> Save &amp; mark completed</button>;
  } else {
    footer = <button type="button" className={styles.btn} onClick={onClose}>Close</button>;
  }

  return (
    <>
      <Modal title={`Baptism · ${b.reference_no}`} wide onClose={onClose} footer={footer}>
        <div className={styles.left}>
          <div className={styles.cardHead}>
            <h2 style={{ fontSize: '1.3rem' }}>{child}</h2>
            <Badge tone={BAPTISM_STATUS[b.status].tone}>{BAPTISM_STATUS[b.status].label}</Badge>
          </div>
          {b.reject_reason && b.status === 'rejected' && <p className={styles.note} style={{ marginBottom: '1rem' }}><b>Rejected:</b> {b.reject_reason}</p>}

          <h3 className={styles.sect}><i className="fa-solid fa-calendar-days" /> Schedule</h3>
          <div className={styles.kv}>
            <KV label="Type" value={type?.title} />
            <KV label="Requested" value={`${fmtDate(b.date)} · ${b.time}`} />
          </div>
          {open && (
            <div className={styles.formGrid} style={{ marginTop: '0.75rem' }}>
              <label><span>Confirmed date</span><input className={styles.input} type="date" value={sched.date} onChange={(e) => setSched({ ...sched, date: e.target.value })} /></label>
              <label><span>Confirmed time</span>
                <select className={styles.select} value={sched.time} onChange={(e) => setSched({ ...sched, time: e.target.value })}>
                  {type?.times.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>
          )}
          {!open && <div className={styles.kv} style={{ marginTop: '0.75rem' }}><KV label="Confirmed" value={`${fmtDate(b.confirmed_date)} · ${b.confirmed_time}`} /></div>}

          <h3 className={styles.sect}><i className="fa-solid fa-baby" /> Child &amp; parents</h3>
          <div className={styles.kv}>
            <KV label="Date of birth" value={fmtDate(b.child.dob)} />
            <KV label="Place of birth" value={b.child.pob} />
            <KV label="Father" value={`${b.father.name} (b. ${b.father.pob})`} />
            <KV label="Mother" value={`${b.mother.name} (b. ${b.mother.pob})`} />
            <KV label={`Married (${b.marriage_kind})`} value={b.venue} />
            <KV label="Address" value={b.address} />
            <KV label="Email" value={b.email} />
            <KV label="Phone" value={b.phone} />
          </div>

          <h3 className={styles.sect}><i className="fa-solid fa-users" /> Sponsors ({b.sponsors.length})</h3>
          <table className={styles.mini}>
            <thead><tr><th>#</th><th>Name</th><th>Address</th></tr></thead>
            <tbody>{b.sponsors.map((s, i) => <tr key={i}><td>{i + 1}</td><td>{s.name}</td><td>{s.address}</td></tr>)}</tbody>
          </table>
          {extra > 0 && <p className={styles.note} style={{ marginTop: '0.5rem' }}>{extra} extra sponsor(s) × {peso(EXTRA_SPONSOR_FEE)} = {peso(extra * EXTRA_SPONSOR_FEE)}</p>}

          <h3 className={styles.sect}><i className="fa-solid fa-folder-open" /> Requirements</h3>
          <div className={styles.files}>
            {required.map((r) => {
              const f = fileOf(r.key);
              if (f) return <div key={r.key} className={styles.fileRow}><span><i className="fa-solid fa-circle-check" style={{ color: '#166534' }} /> {r.label} · {f.name}</span><a href={f.url} target="_blank" rel="noreferrer">View</a></div>;
              if (r.need) return <div key={r.key} className={`${styles.fileRow} ${styles.miss}`}><span><i className="fa-solid fa-triangle-exclamation" /> {r.label} · MISSING</span></div>;
              return <div key={r.key} className={`${styles.fileRow} ${styles.na}`}><span>{r.label} · not required</span></div>;
            })}
          </div>
          {missing.length > 0 && <p className={styles.note} style={{ marginTop: '0.5rem' }}>NO REQUIREMENTS, NO BAPTISM. Missing: {missing.map((m) => m.label).join(', ')}.</p>}

          <h3 className={styles.sect}><i className="fa-solid fa-money-check-dollar" /> Payment</h3>
          <div className={styles.cardHead} style={{ marginBottom: '0.6rem' }}>
            <strong>Total {peso(b.fee_total)}</strong>
            <Badge tone={PAYMENT_STATUS[pay.status].tone}>{PAYMENT_STATUS[pay.status].label}</Badge>
          </div>
          <div className={styles.kv}>
            <KV label="Method" value={gcash ? 'GCash' : 'Pay at the parish office'} />
            {gcash && <KV label="Sender" value={`${pay.sender_account_name} · ${pay.sender_gcash_number}`} />}
          </div>
          {pay.reject_reason && <p className={styles.note} style={{ marginTop: '0.6rem' }}><b>Rejected:</b> {pay.reject_reason}</p>}
          {gcash && pay.proof && <p style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}><i className="fa-solid fa-paperclip" /> {pay.proof.name} · <a href={pay.proof.url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-700)', fontWeight: 700 }}>View proof</a></p>}
          {gcash && open && ['pending', 'rejected'].includes(pay.status) && !mode && (
            <div className={styles.row}>
              <button type="button" className={styles.btn} onClick={() => actions.verifyBaptismPayment(id)}><i className="fa-solid fa-circle-check" /> Verify payment</button>
              {pay.status === 'pending' && <button type="button" className={styles.btnDanger} onClick={() => setMode('rejectPay')}><i className="fa-solid fa-circle-xmark" /> Reject payment</button>}
            </div>
          )}

          {(b.status === 'approved' || locked) && (
            <>
              <h3 className={styles.sect}><i className="fa-solid fa-book-bible" /> Staff use only</h3>
              <div className={styles.formGrid}>
                {[['priest', 'Priest who baptized'], ['received_by', 'Received by'], ['book', 'Book no.'], ['page', 'Page no.'], ['line', 'Line no.'], ['stipend', 'Baptismal stipend']].map(([k, label]) => (
                  <label key={k}><span>{label}</span><input className={styles.input} disabled={locked} value={info[k] || ''} onChange={(e) => setInfo({ ...info, [k]: k === 'priest' || k === 'received_by' ? e.target.value.toUpperCase() : e.target.value })} /></label>
                ))}
              </div>
            </>
          )}

          {mode && (
            <div className={styles.rejectBox}>
              <textarea autoFocus placeholder={mode === 'reject' ? 'Reason for rejecting (sent to the parent by email)' : 'Reason for rejecting the payment (sent by email)'} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          )}

          <h3 className={styles.sect}><i className="fa-solid fa-clock-rotate-left" /> Activity</h3>
          <ul className={styles.timeline}>
            {[...(events[`b${id}`] || [])].reverse().map((e, i) => <li key={i}>{e.note}<small>{e.actor} · {fmtDateTime(e.at)}</small></li>)}
          </ul>
        </div>
      </Modal>

      {mailOpen && (
        <EmailModal mail={buildBaptismEmail(b, 'approved', sched)}
          onSend={() => { actions.approveBaptism(id, sched); setMailOpen(false); }}
          onClose={() => setMailOpen(false)} />
      )}
    </>
  );
}