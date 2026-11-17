import { Link } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import { useStaff, actions } from '../data/store.js';
import { fmtDateTime } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

const TONE = { queued: 'warn', sent: 'ok', failed: 'bad' };

export default function EmailsPage() {
  const { emails } = useStaff();
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Notifications</span>
          <h1>Email Outbox</h1>
          <p>Every email sent to requesters. New ones appear here when you send a certificate or reject a payment.</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Request</th><th>To</th><th>Template</th><th>Subject</th><th>Status</th><th>Attempts</th><th>Queued</th><th /></tr></thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id}>
                <td><Link className={styles.ref} to={e.kind === 'baptism' ? '/staff/baptisms' : e.kind === 'mass' ? '/staff/masses' : `/staff/requests/${e.request_id}`}>{e.reference_no}</Link></td>
                <td>{e.to_email}</td>
                <td>{e.template_key.replace(/_/g, ' ')}</td>
                <td>{e.subject}</td>
                <td>
                  <Badge tone={TONE[e.status]}>{e.status}</Badge>
                  {e.last_error && <small className={styles.muted} style={{ display: 'block' }}>{e.last_error}</small>}
                </td>
                <td>{e.attempts}</td>
                <td className={styles.muted}>{fmtDateTime(e.queued_at)}</td>
                <td>{e.status === 'failed' && <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => actions.retryEmail(e.id)}><i className="fa-solid fa-rotate-right" /> Retry</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}