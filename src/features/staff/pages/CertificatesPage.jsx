import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import CertificateModal from '../components/CertificateModal.jsx';
import { useStaff } from '../data/store.js';
import { STATUS, CERT_LABELS, fmtDateTime } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

export default function CertificatesPage() {
  const { requests, issued, records } = useStaff();
  const [tab, setTab] = useState('toissue');
  const [openId, setOpenId] = useState(null);

  const toIssue = requests.filter((r) => r.status === 'ready' && !issued[r.id]);
  const done = requests.filter((r) => issued[r.id]).sort((a, b) => issued[b.id].issued_at.localeCompare(issued[a.id].issued_at));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Certificates</span>
          <h1>Certificate Generator</h1>
          <p>Generate the e-certificate or printable certificate, then send it by email or release it.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${tab === 'toissue' ? styles.on : ''}`} onClick={() => setTab('toissue')}>To issue ({toIssue.length})</button>
          <button type="button" className={`${styles.tab} ${tab === 'issued' ? styles.on : ''}`} onClick={() => setTab('issued')}>Issued ({done.length})</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {tab === 'toissue' ? (
          toIssue.length === 0 ? <p className={styles.empty}>No requests waiting for a certificate.</p> : (
            <table className={styles.table}>
              <thead><tr><th>Reference</th><th>Name</th><th>Type</th><th>Format</th><th>Record (Book / Page / Line)</th><th>Send via</th><th /></tr></thead>
              <tbody>
                {toIssue.map((r) => {
                  const rec = records[r.id];
                  return (
                    <tr key={r.id}>
                      <td><Link className={styles.ref} to={`/staff/requests/${r.id}`}>{r.reference_no}</Link></td>
                      <td>{r.subject_name}</td>
                      <td>{CERT_LABELS[r.certificate_type]}</td>
                      <td>{r.format === 'digital' ? 'Digital' : 'Hardcopy'}</td>
                      <td>{rec ? <Badge tone="done">{rec.book_no} / {rec.page_no} / {rec.line_no}</Badge> : '—'}</td>
                      <td className={styles.muted}>{r.format === 'digital' ? `Email · ${r.contact_email}` : 'Pickup at parish office'}</td>
                      <td><button type="button" className={`${styles.btn} ${styles.btnSm}`} onClick={() => setOpenId(r.id)}><i className="fa-solid fa-file-circle-plus" /> Generate</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          done.length === 0 ? <p className={styles.empty}>No certificates issued yet.</p> : (
            <table className={styles.table}>
              <thead><tr><th>Reference</th><th>Name</th><th>Type</th><th>Certificate no.</th><th>Issued</th><th>Signed by</th><th>Status</th><th /></tr></thead>
              <tbody>
                {done.map((r) => {
                  const i = issued[r.id];
                  return (
                    <tr key={r.id}>
                      <td><Link className={styles.ref} to={`/staff/requests/${r.id}`}>{r.reference_no}</Link></td>
                      <td>{r.subject_name}</td>
                      <td>{CERT_LABELS[r.certificate_type]} · {r.format === 'digital' ? 'Digital' : 'Hardcopy'}</td>
                      <td>{i.certificate_no || <span className={styles.muted}>— (hardcopy)</span>}</td>
                      <td className={styles.muted}>{fmtDateTime(i.issued_at)}</td>
                      <td>{i.signed_by}</td>
                      <td><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                      <td><button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpenId(r.id)}><i className="fa-solid fa-eye" /> View / Send</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {openId && <CertificateModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}