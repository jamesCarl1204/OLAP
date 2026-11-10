import { useState } from 'react';
import styles from './LoginForm.module.css';

const EMPTY = {
  firstName: '', middleName: '', lastName: '',
  phone: '', location: '',
  email: '', password: '', confirm: '',
};

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

// UI only for now. Auth logic will live in features/auth (hooks/ + api/) later.
export default function LoginForm() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const isLogin = mode === 'login';

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = (m) => {
    setMode(m);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLogin && form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    // TODO: call login / register API here
  };

  return (
    <div className={styles.card} id="login">
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <i className={`fa-solid ${isLogin ? 'fa-user-lock' : 'fa-user-plus'}`} />
        </span>
        <div>
          <h3>{isLogin ? 'Sign In to OLAP' : 'Create an Account'}</h3>
          <p>{isLogin ? 'Welcome back, please sign in' : 'Fill in your details to register'}</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${isLogin ? styles.active : ''}`}
          onClick={() => switchMode('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`${styles.tab} ${!isLogin ? styles.active : ''}`}
          onClick={() => switchMode('register')}
        >
          Sign Up
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className={styles.row2}>
              <Field label="First Name" icon="fa-solid fa-user" name="firstName"
                value={form.firstName} onChange={update} placeholder="Juan" required />
              <Field label="Middle Name" icon="fa-solid fa-user" name="middleName"
                value={form.middleName} onChange={update} placeholder="Santos" />
            </div>
            <Field label="Last Name" icon="fa-solid fa-user" name="lastName"
              value={form.lastName} onChange={update} placeholder="Dela Cruz" required />
            <Field label="Phone Number" icon="fa-solid fa-phone" type="tel" name="phone"
              value={form.phone} onChange={update} placeholder="09XX XXX XXXX" required />
            <Field label="Location" icon="fa-solid fa-location-dot" name="location"
              value={form.location} onChange={update} placeholder="Barangay, City" required />
          </>
        )}

        <Field
          label={isLogin ? 'Username or Email' : 'Email'}
          icon="fa-solid fa-envelope"
          type={isLogin ? 'text' : 'email'}
          name="email"
          value={form.email}
          onChange={update}
          placeholder="user@olap.ph"
          required
        />

        <Field label="Password" icon="fa-solid fa-key" type="password" name="password"
          value={form.password} onChange={update} placeholder="••••••••" required />

        {!isLogin && (
          <Field label="Confirm Password" icon="fa-solid fa-lock" type="password" name="confirm"
            value={form.confirm} onChange={update} placeholder="••••••••" required />
        )}

        {error && <p className={styles.error}>{error}</p>}

        {isLogin && (
          <div className={styles.row}>
            <label className={styles.remember}>
              <input type="checkbox" /> <span>Remember Me</span>
            </label>
            <a href="#login" className={styles.forgot}>Forgot Password?</a>
          </div>
        )}

        <button type="submit" className={styles.submit}>
          <i className={`fa-solid ${isLogin ? 'fa-right-to-bracket' : 'fa-user-plus'}`} />{' '}
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}