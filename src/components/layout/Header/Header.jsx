import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../../../data/services.js';
import styles from './Header.module.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link to="/#home" className={styles.brand}>
          <span className={styles.logo}><span><i className="fa-solid fa-church" /></span></span>
          <span className={styles.brandText}>
            <strong>OLAP <em>PIMS Analytics</em></strong>
            <small>Our Lady of the Airways Parish</small>
          </span>
        </Link>

        <nav className={styles.nav}>
          <Link to="/#home">Home</Link>
          <Link to="/#about">About</Link>
          <div className={styles.dropdown}>
            <button className={styles.dropBtn}>
              Services <i className="fa-solid fa-chevron-down" />
            </button>
            <div className={styles.menu}>
              <div className={styles.menuTitle}>Proposed Parish Services</div>
              {SERVICES.map((s) => (
                <Link key={s.id} to={`/#service-${s.id}`}>
                  <i className={s.icon} /> {s.navLabel}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/#contact">Contact</Link>
        </nav>

        <Link to="/login" className={styles.portalBtn}>
          <i className="fa-solid fa-calendar-check" /> Book Now
        </Link>

        <button className={styles.burger} onClick={() => setOpen(!open)} aria-label="Menu">
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
      </div>

      {open && (
        <div className={styles.mobile}>
          <Link to="/#home" onClick={close}>Home</Link>
          <Link to="/#about" onClick={close}>About</Link>
          <Link to="/#services" onClick={close}>Services</Link>
          <Link to="/#contact" onClick={close}>Contact</Link>
          <Link to="/login" onClick={close} className={styles.mobilePortal}>
            <i className="fa-solid fa-calendar-check" /> Book Now
          </Link>
        </div>
      )}
    </header>
  );
}