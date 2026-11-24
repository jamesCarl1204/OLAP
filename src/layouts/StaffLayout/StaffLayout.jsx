import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useStaff } from '../../features/staff/data/store.js';
import styles from './StaffLayout.module.css';

const NAV = [
  { to: '/staff', label: 'Dashboard', icon: 'fa-solid fa-chart-pie', end: true },
  { to: '/staff/requests', label: 'Requests', icon: 'fa-solid fa-inbox' },
  { to: '/staff/payments', label: 'Payments', icon: 'fa-solid fa-money-check-dollar' },
  { to: '/staff/certificates', label: 'Certificates', icon: 'fa-solid fa-stamp' },
  { to: '/staff/baptisms', label: 'Baptisms', icon: 'fa-solid fa-water' },
  { to: '/staff/masses', label: 'Mass Intentions', icon: 'fa-solid fa-hands-praying' },
  { to: '/staff/marriages', label: 'Marriage Bookings', icon: 'fa-solid fa-ring' },
  { to: '/staff/records', label: 'Records', icon: 'fa-solid fa-book-bible' },
  { to: '/staff/emails', label: 'Email Outbox', icon: 'fa-solid fa-envelope' },
];

export default function StaffLayout() {
  const [open, setOpen] = useState(false);
  const { requests, issued, baptisms, masses, marriages } = useStaff();
  const counts = {
    '/staff/payments': requests.filter((r) => r.status === 'payment_check').length,
    '/staff/certificates': requests.filter((r) => r.status === 'ready' && !issued[r.id]).length,
    '/staff/baptisms': baptisms.filter((b) => b.status === 'pending').length,
    '/staff/masses': masses.filter((m) => m.status === 'pending').length,
    '/staff/marriages': marriages.filter((m) => m.status === 'pending').length,
  };
  const close = () => setOpen(false);

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      // Full reload also clears the in-memory staff data.
      window.location.assign('/login');
    }
  };

  return (
    <div className={styles.shell}>
      <aside className={`${styles.side} ${open ? styles.open : ''}`}>
        <Link to="/staff" className={styles.brand} onClick={close}>
          <span className={styles.logo}><i className="fa-solid fa-church" /></span>
          <span><strong>OLAP</strong><small>Staff Portal</small></span>
        </Link>

        <nav className={styles.nav}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={close}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              <i className={n.icon} /> {n.label}
              {counts[n.to] > 0 && <span className={styles.count}>{counts[n.to]}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.user}>
          <span className={styles.avatar}>PS</span>
          <div>
            <strong>Parish Staff</strong>
            <a href="/login" onClick={(e) => { e.preventDefault(); signOut(); }}>
              <i className="fa-solid fa-right-from-bracket" /> Sign out
            </a>
          </div>
        </div>
      </aside>

      {open && <div className={styles.backdrop} onClick={close} />}

      <div className={styles.main}>
        <header className={styles.top}>
          <button className={styles.burger} onClick={() => setOpen(true)} aria-label="Open menu">
            <i className="fa-solid fa-bars" />
          </button>
          <span className={styles.topTitle}>Our Lady of the Airways Parish</span>
        </header>
        <div className={styles.content}><Outlet /></div>
      </div>
    </div>
  );
}