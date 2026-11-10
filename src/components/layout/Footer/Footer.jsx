import { Link } from 'react-router-dom';
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
              <li><Link to="/#home">Home Portal</Link></li>
              <li><Link to="/#about">About System</Link></li>
              <li><Link to="/#services">Proposed Services</Link></li>
              <li><Link to="/#contact">Parish Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4>System Roles</h4>
            <ul>
              {Object.entries(ROLES).map(([name, r]) => (
                <li key={name}><Link to="/login">{r.footerLabel}</Link></li>
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