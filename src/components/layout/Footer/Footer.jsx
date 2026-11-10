import { ROLES } from '../../../features/auth/roles.js';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.about}>
            <div className={styles.brand}><i className="fa-solid fa-church" /> <span>OLAP System</span></div>
            <p>Our Lady of the Airways Parish Information Management System with Data Analytics. Empowering the Catholic parish community with modernized digital record management.</p>
          </div>

          <div>
            <h4>Quick Navigation</h4>
            <ul>
              <li><a href="#home">Home Portal</a></li>
              <li><a href="#about">About System</a></li>
              <li><a href="#services">Proposed Services</a></li>
              <li><a href="#contact">Parish Contact</a></li>
            </ul>
          </div>

          <div>
            <h4>System Roles</h4>
            <ul>
              {Object.entries(ROLES).map(([name, r]) => (
                <li key={name}><a href="#login">{r.footerLabel}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; 2026 Our Lady of the Airways Parish. All rights reserved.</p>
          <p>OLAP Information Management System with Data Analytics</p>
        </div>
      </div>
    </footer>
  );
}
