import { useState } from 'react';
import Badge from '../components/Badge.jsx';
import BaptismModal from '../components/BaptismModal.jsx';
import { useStaff } from '../data/store.js';
import { BAPTISM_STATUS, PAYMENT_STATUS, peso, fmtDate } from '../data/mock.js';
import { BAPTISM_TYPES } from '../../../data/certificates.js';
import styles from '../styles/Staff.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'completed', label: 'Completed' },
  { id: 'closed', label: 'On hold / Rejected' },
];
const inTab = (b, t) => t === 'all' || (t === 'closed' ? ['on_hold', 'rejected'].includes(b.status) : b.status === t);
const childName = (b) => [b.child.given, b.child.middle, b.child.surname].filter(Boolean).join(' ');

export default function BaptismsPage() {
  const { baptisms } = useStaff();
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const term = q.trim().toLowerCase();

  const rows = baptisms
    .filter((b) => inTab(b, tab))
    .filter((b) => !term || [b.reference_no, childName(b), b.father.name, b.mother.name, b.email].some((v) => v.toLowerCase().includes(term)))
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Parish Services</span>
          <h1>Baptism Registrations</h1>
          <p>Check the requirements and payment, then confirm the schedule by email.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`${styles.tab} ${tab === t.id ? styles.on : ''}`} onClick={() => setTab(t.id)}>
              {t.label} ({baptisms.filter((b) => inTab(b, t.id)).length})
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <i className="fa-solid fa-magnifying-glass" />
          <input className={styles.input} placeholder="Search reference, child, parent, email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? <p className={styles.empty}>No registrations here.</p> : (
          <table className={styles.table}>
            <thead><tr><th>Reference</th><th>Child</th><th>Parents</th><th>Type</th><th>Schedule</th><th>Sponsors</th><th>Fee</th><th>Payment</th><th>Status</th><th>Submitted</th><th /></tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td><button type="button" className={styles.ref} style={{ fontWeight: 700 }} onClick={() => setOpenId(b.id)}>{b.reference_no}</button></td>
                  <td>{childName(b)}</td>
                  <td>{b.father.name} &amp; {b.mother.name}</td>
                  <td>{BAPTISM_TYPES.find((t) => t.id === b.type_id)?.title}</td>
                  <td>{fmtDate(b.confirmed_date)} · {b.confirmed_time}</td>
                  <td>{b.sponsors.length}</td>
                  <td><b>{peso(b.fee_total)}</b></td>
                  <td><Badge tone={PAYMENT_STATUS[b.payment.status].tone}>{PAYMENT_STATUS[b.payment.status].label}</Badge></td>
                  <td><Badge tone={BAPTISM_STATUS[b.status].tone}>{BAPTISM_STATUS[b.status].label}</Badge></td>
                  <td className={styles.muted}>{fmtDate(b.submitted_at)}</td>
                  <td><button type="button" className={`${b.status === 'pending' ? styles.btn : styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpenId(b.id)}><i className="fa-solid fa-eye" /> {b.status === 'pending' ? 'Review' : 'View'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openId && <BaptismModal key={openId} id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}