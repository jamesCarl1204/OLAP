import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import ProofModal from '../components/ProofModal.jsx';
import { useStaff } from '../data/store.js';
import { STATUS, PAYMENT_STATUS, peso, fmtDate } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'To verify' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'pickup', label: 'Pay on pickup' },
];

export default function PaymentsPage() {
  const { requests } = useStaff();
  const [tab, setTab] = useState('all');
  const [openId, setOpenId] = useState(null);

  const rows = requests.filter((r) => {
    if (tab === 'review') return r.status === 'payment_check';
    if (tab === 'verified') return r.payment.status === 'verified';
    if (tab === 'rejected') return r.payment.status === 'rejected';
    if (tab === 'pickup') return r.payment.method === 'pickup';
    return true;
  });

  const sum = (f) => requests.filter(f).reduce((t, r) => t + r.fee_amount, 0);
  const toVerify = requests.filter((r) => r.status === 'payment_check').length;
  const stats = [
    { icon: 'fa-solid fa-hourglass-half', value: toVerify, label: 'Proofs to verify' },
    { icon: 'fa-solid fa-circle-check', value: peso(sum((r) => r.payment.status === 'verified')), label: 'GCash verified' },
    { icon: 'fa-solid fa-hand-holding-dollar', value: peso(sum((r) => r.payment.method === 'pickup' && !['released', 'rejected'].includes(r.status))), label: 'To collect on pickup' },
    { icon: 'fa-solid fa-circle-xmark', value: requests.filter((r) => r.payment.status === 'rejected').length, label: 'Rejected proofs' },
  ];

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Payments</span>
          <h1>Payments &amp; Proof of Payment</h1>
          <p>Review the proof uploaded by requesters and verify or reject it.</p>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statIcon}><i className={s.icon} /></span>
            <div><b style={{ fontSize: typeof s.value === 'string' ? '1.35rem' : undefined }}>{s.value}</b><span>{s.label}</span></div>
          </div>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`${styles.tab} ${tab === t.id ? styles.on : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? <p className={styles.empty}>Nothing here.</p> : (
          <table className={styles.table}>
            <thead><tr><th>Reference</th><th>Name</th><th>Format</th><th>Method</th><th>Amount</th><th>Proof</th><th>Payment</th><th>Request</th><th>Submitted</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const p = r.payment;
                return (
                  <tr key={r.id}>
                    <td><Link className={styles.ref} to={`/staff/requests/${r.id}`}>{r.reference_no}</Link></td>
                    <td>{r.subject_name}</td>
                    <td>{r.format === 'digital' ? 'Digital' : 'Hardcopy'}</td>
                    <td><span className={styles.methodCell}><i className={p.method === 'gcash' ? 'fa-solid fa-mobile-screen' : 'fa-solid fa-hand-holding-dollar'} /> {p.method === 'gcash' ? 'GCash' : 'Pay on pickup'}</span></td>
                    <td><b>{peso(r.fee_amount)}</b></td>
                    <td>
                      {p.proof
                        ? <button type="button" className={styles.thumbSm} onClick={() => setOpenId(r.id)} aria-label="View proof">
                            {p.proof.type === 'image' ? <img src={p.proof.url} alt="" /> : <i className="fa-solid fa-file-pdf" />}
                          </button>
                        : <span className={styles.muted}>—</span>}
                    </td>
                    <td><Badge tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</Badge></td>
                    <td><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                    <td className={styles.muted}>{fmtDate(r.submitted_at)}</td>
                    <td>
                      {p.proof && (
                        <button type="button" className={`${r.status === 'payment_check' ? styles.btn : styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpenId(r.id)}>
                          <i className="fa-solid fa-eye" /> {r.status === 'payment_check' ? 'Review' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openId && <ProofModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}