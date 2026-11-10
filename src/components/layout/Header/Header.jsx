import { useState } from 'react';
import { SERVICES } from '../../../data/services.js';
import styles from './Header.module.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <a href="#home" className={styles.brand}>
          <span className={styles.logo}><span><i className="fa-solid fa-church" /></span></span>
          <span className={styles.brandText}>
            <strong>OLAP <em>PIMS Analytics</em></strong>
            <small>Our Lady of the Airways Parish</small>
          </span>
        </a>

        <nav className={styles.nav}>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <div className={styles.dropdown}>
            <button className={styles.dropBtn}>
              Services <i className="fa-solid fa-chevron-down" />
            </button>
            <div className={styles.menu}>
              <div className={styles.menuTitle}>Proposed Parish Services</div>
              {SERVICES.map((s) => (
                <a key={s.id} href={`#service-${s.id}`}>
                  <i className={s.icon} /> {s.navLabel}
                </a>
              ))}
            </div>
          </div>
          <a href="#contact">Contact</a>
        </nav>

        <a href="#login" className={styles.portalBtn}>
          <i className="fa-solid fa-lock" /> Access Portal
        </a>

        <button className={styles.burger} onClick={() => setOpen(!open)} aria-label="Menu">
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
      </div>

      {open && (
        <div className={styles.mobile}>
          <a href="#home" onClick={close}>Home</a>
          <a href="#about" onClick={close}>About</a>
          <a href="#services" onClick={close}>Services</a>
          <a href="#contact" onClick={close}>Contact</a>
          <a href="#login" onClick={close} className={styles.mobilePortal}>
            <i className="fa-solid fa-right-to-bracket" /> Sign In
          </a>
        </div>
      )}
    </header>
  );
}
