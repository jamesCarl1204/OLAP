import { Link } from 'react-router-dom';
import Badge from '../components/Badge.jsx';
import { useStaff } from '../data/store.js';
import { STATUS, CERT_LABELS, peso, fmtDate } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

export default function DashboardPage() {
  const { requests, emails, issued, baptisms, masses } = useStaff();
  const count = (s) => requests.filter((r) => r.status === s).length;
  const toIssue = requests.filter((r) => r.status === 'ready' && !issued[r.id]).length;
  const failed = emails.filter((e) => e.status === 'failed').length;
  const verified = requests.filter((r) => r.payment.status === 'verified').reduce((t, r) => t + r.fee_amount, 0);
  const pickup = requests.filter((r) => r.payment.method === 'pickup' && !['released', 'rejected'].includes(r.status)).reduce((t, r) => t + r.fee_amount, 0);

  const stats = [
    { icon: 'fa-solid fa-inbox', value: count('submitted'), label: 'New requests', to: '/staff/requests' },
    { icon: 'fa-solid fa-money-check-dollar', value: count('payment_check'), label: 'Proofs to verify', to: '/staff/payments' },
    { icon: 'fa-solid fa-magnifying-glass', value: count('record_check'), label: 'Records to check', to: '/staff/requests' },
    { icon: 'fa-solid fa-stamp', value: toIssue, label: 'Certificates to issue', to: '/staff/certificates' },
  { icon: 'fa-solid fa-water', value: baptisms.filter((b) => b.status === 'pending').length, label: 'Baptisms to review', to: '/staff/baptisms' },
{ icon: 'fa-solid fa-hands-praying', value: masses.filter((m) => m.status === 'pending').length, label: 'Mass Intentions to verify', to: '/staff/masses' },
  ];
  const recent = [...requests].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)).slice(0, 5);
  const byStatus = Object.keys(STATUS).map((k) => ({ key: k, n: count(k) }));

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Dashboard</h1>
          <p>Summary of certificate requests, payments, and records.</p>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className={styles.stat}>
            <span className={styles.statIcon}><i className={s.icon} /></span>
            <div><b>{s.value}</b><span>{s.label}</span></div>
          </Link>
        ))}
      </div>

      <div className={styles.cols}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2><i className="fa-solid fa-clock-rotate-left" /> Recent requests</h2>
            <Link to="/staff/requests">View all</Link>
          </div>
          <div className={styles.tableWrap} style={{ boxShadow: 'none' }}>
            <table className={styles.table}>
              <thead><tr><th>Reference</th><th>Name</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td><Link className={styles.ref} to={`/staff/requests/${r.id}`}>{r.reference_no}</Link></td>
                    <td>{r.subject_name}</td>
                    <td>{CERT_LABELS[r.certificate_type]}</td>
                    <td><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                    <td className={styles.muted}>{fmtDate(r.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.stack}>
          <div className={styles.card}>
            <h2><i className="fa-solid fa-peso-sign" /> Payments</h2>
            <div className={styles.kv} style={{ gridTemplateColumns: '1fr' }}>
              <div><small>GCash verified</small><strong>{peso(verified)}</strong></div>
              <div><small>To collect on pickup</small><strong>{peso(pickup)}</strong></div>
            </div>
          </div>

          <div className={styles.card}>
            <h2><i className="fa-solid fa-chart-simple" /> By status</h2>
            <div className={styles.bars}>
              {byStatus.map(({ key, n }) => (
                <div key={key} className={styles.bar}>
                  <div><span>{STATUS[key].label}</span><b>{n}</b></div>
                  <div className={styles.track}><div className={styles.fill} style={{ width: `${(n / requests.length) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {failed > 0 && (
            <div className={styles.card}>
              <h2><i className="fa-solid fa-triangle-exclamation" /> Needs attention</h2>
              <p className={styles.note}><b>{failed}</b> email failed to send. <Link to="/staff/emails" style={{ color: 'var(--gold-700)', fontWeight: 600 }}>Check the outbox</Link></p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}