import { useState } from 'react';
import { ROLES, ROLE_NAMES } from '../../roles.js';
import styles from './LoginForm.module.css';

// UI only for now. Auth logic will live in features/auth (hooks/ + api/) later.
export default function LoginForm() {
  const [role, setRole] = useState('Parishioner');

  return (
    <div className={styles.card} id="login">
      <div className={styles.head}>
        <span className={styles.headIcon}><i className="fa-solid fa-user-lock" /></span>
        <div>
          <h3>Sign In to OLAP</h3>
          <p>Choose your role to continue</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {ROLE_NAMES.map((r) => (
          <button
            type="button"
            key={r}
            className={`${styles.tab} ${r === role ? styles.active : ''}`}
            onClick={() => setRole(r)}
          >
            {ROLES[r].label}
          </button>
        ))}
      </div>

      <div className={styles.info}>
        <i className="fa-solid fa-circle-info" />
        <p><strong>{role}:</strong> {ROLES[role].desc}</p>
      </div>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <label>
          <span>Username or Email</span>
          <div className={styles.field}>
            <i className="fa-solid fa-envelope" />
            <input type="text" placeholder="user@olap.ph" />
          </div>
        </label>

        <label>
          <span>Password</span>
          <div className={styles.field}>
            <i className="fa-solid fa-key" />
            <input type="password" placeholder="••••••••" />
          </div>
        </label>

        <div className={styles.row}>
          <label className={styles.remember}>
            <input type="checkbox" /> <span>Remember Me</span>
          </label>
          <a href="#login" className={styles.forgot}>Forgot Password?</a>
        </div>

        <button type="submit" className={styles.submit}>
          <i className="fa-solid fa-right-to-bracket" /> Sign In
        </button>
      </form>
    </div>
  );
}
