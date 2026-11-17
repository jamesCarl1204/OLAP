import { useState } from 'react';
import Badge from '../components/Badge.jsx';
import MassModal from '../components/MassModal.jsx';
import { useStaff } from '../data/store.js';
import { MASS_STATUS, MASS_PAYMENT, fmtDate } from '../data/mock.js';
import { MASS_TYPES } from '../../../data/certificates.js';
import styles from '../styles/Staff.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
];

export default function MassIntentionsPage() {
  const { masses } = useStaff();
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const term = q.trim().toLowerCase();

  const rows = masses
    .filter((m) => tab === 'all' || m.status === tab)
    .filter((m) => !term || [m.reference_no, m.requestor, m.prayed_for].some((v) => v.toLowerCase().includes(term)))
    .sort((a, b) => a.confirmed_date.localeCompare(b.confirmed_date));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Parish Services</span>
          <h1>Mass Intentions</h1>
          <p>Verify the request, the schedule, and the offering, then confirm. Mark it completed after the Mass.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`${styles.tab} ${tab === t.id ? styles.on : ''}`} onClick={() => setTab(t.id)}>
              {t.label} ({t.id === 'all' ? masses.length : masses.filter((m) => m.status === t.id).length})
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <i className="fa-solid fa-magnifying-glass" />
          <input className={styles.input} placeholder="Search reference, requestor, prayed for" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? <p className={styles.empty}>No Mass Intentions here.</p> : (
          <table className={styles.table}>
            <thead><tr><th>Ref. no.</th><th>Requestor</th><th>Prayed for</th><th>Type</th><th>Date</th><th>Mass time</th><th>Payment</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td><button type="button" className={styles.ref} style={{ fontWeight: 700 }} onClick={() => setOpenId(m.id)}>{m.reference_no}</button></td>
                  <td>{m.requestor}</td>
                  <td>{m.prayed_for}</td>
                  <td>{MASS_TYPES.find((t) => t.id === m.type_id)?.title}</td>
                  <td>{fmtDate(m.confirmed_date)}</td>
                  <td>{m.confirmed_time}</td>
                  <td><Badge tone={MASS_PAYMENT[m.payment.status].tone}>{MASS_PAYMENT[m.payment.status].label}</Badge></td>
                  <td><Badge tone={MASS_STATUS[m.status].tone}>{MASS_STATUS[m.status].label}</Badge></td>
                  <td><button type="button" className={`${m.status === 'pending' ? styles.btn : styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpenId(m.id)}><i className="fa-solid fa-eye" /> {m.status === 'pending' ? 'Review' : 'View'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openId && <MassModal key={openId} id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}