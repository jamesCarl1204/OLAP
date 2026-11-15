import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.about}>
            <div className={styles.brand}><i className="fa-solid fa-church" /> <span>OLAP System</span></div>
            <p>Our Lady of the Airways Parish Information Management System for organizing parish service requests, appointments, and sacramental records.</p>
          </div>

          <div>
            <h4>Quick Navigation</h4>
            <ul>
              <li><Link to="/#home">Home</Link></li>
              <li><Link to="/#about">About</Link></li>
              <li><Link to="/#services">Services</Link></li>
              <li><Link to="/#contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4>Staff Access</h4>
            <ul>
              <li><Link to="/login">Staff Login</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; 2026 Our Lady of the Airways Parish. All rights reserved.</p>
          <p>OLAP Information Management System</p>
        </div>
      </div>
    </footer>
  );
}
