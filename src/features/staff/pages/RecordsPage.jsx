import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import { REQUESTS, STATUS, CERT_LABELS, peso, fmtDate } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

export default function RequestsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const term = q.trim().toLowerCase();
  const rows = REQUESTS
    .filter((r) => !status || r.status === status)
    .filter((r) => !type || r.certificate_type === type)
    .filter((r) => !term || [r.reference_no, r.subject_name, r.contact_email].some((v) => v.toLowerCase().includes(term)))
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Certificates</span>
          <h1>Requests</h1>
          <p>{rows.length} of {REQUESTS.length} requests</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <i className="fa-solid fa-magnifying-glass" />
          <input className={styles.input} placeholder="Search reference no., name, or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All certificate types</option>
          {Object.entries(CERT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? <p className={styles.empty}>No requests match your filters.</p> : (
          <table className={styles.table}>
            <thead>
              <tr><th>Reference</th><th>Name on certificate</th><th>Type</th><th>Format</th><th>Fee</th><th>Status</th><th>Submitted</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link className={styles.ref} to={`/staff/requests/${r.id}`}>{r.reference_no}</Link></td>
                  <td>{r.subject_name}</td>
                  <td>{CERT_LABELS[r.certificate_type]}</td>
                  <td>{r.format === 'digital' ? 'Digital' : 'Hardcopy'}</td>
                  <td>{peso(r.fee_amount)}</td>
                  <td><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                  <td className={styles.muted}>{fmtDate(r.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}