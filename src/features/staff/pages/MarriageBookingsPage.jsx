import { useMemo, useState } from 'react';
import Badge from '../components/Badge.jsx';
import { useStaff } from '../data/store.js';
import { peso, fmtDate, fmtDateTime } from '../data/mock.js';
import styles from '../styles/Staff.module.css';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'completed', label: 'Completed' },
  { id: 'closed', label: 'Rejected / On hold' },
];

const STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  on_hold: { label: 'On hold', tone: 'warning' },
};

const PAYMENT = {
  pending: { label: 'For verification', tone: 'warning' },
  paid_on_pickup: { label: 'Pay on pickup', tone: 'muted' },
  verified: { label: 'Verified', tone: 'success' },
  paid: { label: 'Paid', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const titleCase = (value) => String(value || '—').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const dateValue = (value) => value ? fmtDate(value) : '—';
const nameOf = (m) => [m.groom?.name, m.bride?.name].filter(Boolean).join(' & ');
const statusOf = (value) => STATUS[value] || { label: titleCase(value), tone: 'muted' };
const paymentOf = (value) => PAYMENT[value] || { label: titleCase(value), tone: 'muted' };

function Detail({ booking, events }) {
  const payment = booking.payment || {};
  return (
    <div className={styles.card} style={{ marginTop: '1rem' }}>
      <div className={styles.cardHead}>
        <h2><i className="fa-solid fa-ring" /> Booking details</h2>
        <Badge tone={statusOf(booking.status).tone}>{statusOf(booking.status).label}</Badge>
      </div>
      <div className={styles.kv}>
        <div><small>Reference number</small><strong>{booking.reference_no || '—'}</strong></div>
        <div><small>Marriage type</small><strong>{titleCase(booking.type_id)}</strong></div>
        <div><small>Requested schedule</small><strong>{dateValue(booking.date)} · {booking.time || '—'}</strong></div>
        <div><small>Confirmed schedule</small><strong>{dateValue(booking.confirmed_date)} · {booking.confirmed_time || '—'}</strong></div>
        <div><small>Groom</small><strong>{booking.groom?.name || '—'}</strong></div>
        <div><small>Groom date/place of birth</small><strong>{dateValue(booking.groom?.dob)} · {booking.groom?.pob || '—'}</strong></div>
        <div><small>Bride</small><strong>{booking.bride?.name || '—'}</strong></div>
        <div><small>Bride date/place of birth</small><strong>{dateValue(booking.bride?.dob)} · {booking.bride?.pob || '—'}</strong></div>
        <div><small>Address</small><strong>{booking.address || '—'}</strong></div>
        <div><small>Contact person</small><strong>{booking.contact_name || '—'}</strong></div>
        <div><small>Email</small><strong>{booking.email || '—'}</strong></div>
        <div><small>Phone</small><strong>{booking.phone || '—'}</strong></div>
        <div><small>Marriage fee</small><strong>{peso(booking.fee_total || 0)}</strong></div>
        <div><small>Submitted</small><strong>{fmtDateTime(booking.submitted_at)}</strong></div>
      </div>

      <h2 style={{ marginTop: '1.25rem' }}><i className="fa-solid fa-money-check-dollar" /> Payment</h2>
      <div className={styles.kv}>
        <div><small>Method</small><strong>{titleCase(payment.method)}</strong></div>
        <div><small>Payment status</small><strong><Badge tone={paymentOf(payment.status).tone}>{paymentOf(payment.status).label}</Badge></strong></div>
        {payment.sender_gcash_number && <div><small>GCash number</small><strong>{payment.sender_gcash_number}</strong></div>}
        {payment.sender_account_name && <div><small>GCash account name</small><strong>{payment.sender_account_name}</strong></div>}
        {payment.reject_reason && <div><small>Payment rejection reason</small><strong>{payment.reject_reason}</strong></div>}
      </div>
      {payment.proof && (
        <p className={styles.note} style={{ marginTop: '0.75rem' }}>
          <a className={styles.link} href={payment.proof.url} target="_blank" rel="noreferrer">
            <i className="fa-solid fa-file-arrow-up" /> View proof of payment — {payment.proof.name || 'Open file'}
          </a>
          {payment.proof.size_kb ? ` · ${payment.proof.size_kb} KB` : ''}
        </p>
      )}

      <h2 style={{ marginTop: '1.25rem' }}><i className="fa-solid fa-folder-open" /> Submitted documents</h2>
      {booking.files?.length ? (
        <ul className={styles.timeline}>
          {booking.files.map((file, index) => (
            <li key={file.url || index}>
              {file.label || file.name || 'Document'}
              <small><a className={styles.link} href={file.url} target="_blank" rel="noreferrer">View {file.name || 'document'}</a></small>
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>No documents were returned by the server.</p>}

      <h2 style={{ marginTop: '1.25rem' }}><i className="fa-solid fa-clock-rotate-left" /> Activity</h2>
      {events?.length ? (
        <ul className={styles.timeline}>
          {[...events].reverse().map((event, index) => (
            <li key={index}>{event.note || 'Booking updated'}<small>{event.actor || 'Parish staff'} · {fmtDateTime(event.at)}</small></li>
          ))}
        </ul>
      ) : <p className={styles.empty}>No activity recorded yet.</p>}
      {booking.reject_reason && <p className={styles.note} style={{ marginTop: '1rem' }}><b>Rejection reason:</b> {booking.reject_reason}</p>}
    </div>
  );
}

export default function MarriageBookingsPage() {
  const { marriages, marriageEvents, error } = useStaff();
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const term = query.trim().toLowerCase();

  const rows = useMemo(() => marriages
    .filter((m) => tab === 'all' || (tab === 'closed' ? ['rejected', 'on_hold'].includes(m.status) : m.status === tab))
    .filter((m) => !term || [m.reference_no, nameOf(m), m.email, m.phone].some((value) => String(value || '').toLowerCase().includes(term)))
    .sort((a, b) => String(b.submitted_at || '').localeCompare(String(a.submitted_at || ''))), [marriages, tab, term]);

  const selected = marriages.find((m) => m.id === openId);
  const countFor = (id) => id === 'all' ? marriages.length : id === 'closed'
    ? marriages.filter((m) => ['rejected', 'on_hold'].includes(m.status)).length
    : marriages.filter((m) => m.status === id).length;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className="eyebrow">Parish Services</span>
          <h1>Marriage Bookings</h1>
          <p>Review submitted marriage booking details, requirements, and payment information.</p>
        </div>
      </div>

      {error && <p className={styles.note}>{error}</p>}

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((item) => (
            <button key={item.id} type="button" className={`${styles.tab} ${tab === item.id ? styles.on : ''}`} onClick={() => setTab(item.id)}>
              {item.label} ({countFor(item.id)})
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <i className="fa-solid fa-magnifying-glass" />
          <input className={styles.input} placeholder="Search reference, couple, email, or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? <p className={styles.empty}>No marriage bookings found in this view.</p> : (
          <table className={styles.table}>
            <thead><tr><th>Reference</th><th>Couple</th><th>Type</th><th>Wedding date</th><th>Fee</th><th>Payment</th><th>Status</th><th>Submitted</th><th /></tr></thead>
            <tbody>
              {rows.map((booking) => {
                const status = statusOf(booking.status);
                const payment = paymentOf(booking.payment?.status);
                return (
                  <tr key={booking.id}>
                    <td><button type="button" className={styles.ref} style={{ fontWeight: 700 }} onClick={() => setOpenId(openId === booking.id ? null : booking.id)}>{booking.reference_no}</button></td>
                    <td>{nameOf(booking) || '—'}</td>
                    <td>{titleCase(booking.type_id)}</td>
                    <td>{dateValue(booking.confirmed_date || booking.date)}</td>
                    <td><b>{peso(booking.fee_total || 0)}</b></td>
                    <td><Badge tone={payment.tone}>{payment.label}</Badge></td>
                    <td><Badge tone={status.tone}>{status.label}</Badge></td>
                    <td className={styles.muted}>{dateValue(booking.submitted_at)}</td>
                    <td><button type="button" className={`${booking.status === 'pending' ? styles.btn : styles.btnGhost} ${styles.btnSm}`} onClick={() => setOpenId(openId === booking.id ? null : booking.id)}><i className="fa-solid fa-eye" /> {openId === booking.id ? 'Hide details' : 'View details'}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <Detail booking={selected} events={marriageEvents?.[`w${selected.id}`] || []} />}
    </>
  );
}
