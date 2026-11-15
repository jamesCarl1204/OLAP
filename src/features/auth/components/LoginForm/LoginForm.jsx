import { useState } from 'react';
import styles from './LoginForm.module.css';

function Field({ label, icon, ...props }) {
  return (
    <label>
      <span>{label}</span>
      <div className={styles.field}>
        <i className={icon} />
        <input {...props} />
      </div>
    </label>
  );
}

// Staff-only login form. Authentication logic will be connected later.
export default function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // TODO: call the staff login API here.
  };

  return (
    <div className={styles.card} id="login">
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <i className="fa-solid fa-user-lock" />
        </span>
        <div>
          <h3>Sign In to OLAP</h3>
          <p>Staff access only. Please sign in to continue.</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field
          label="Username or Email"
          icon="fa-solid fa-envelope"
          type="text"
          name="email"
          value={form.email}
          onChange={update}
          placeholder="Enter your username or email"
          autoComplete="username"
          required
        />

        <Field
          label="Password"
          icon="fa-solid fa-key"
          type="password"
          name="password"
          value={form.password}
          onChange={update}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.row}>
          <label className={styles.remember}>
            <input type="checkbox" /> <span>Remember Me</span>
          </label>
          <a href="#login" className={styles.forgot}>Forgot Password?</a>
        </div>

        <button type="submit" className={styles.submit}>
          <i className="fa-solid fa-right-to-bracket" />{' '}
          Sign In
        </button>
      </form>
    </div>
  );
}
