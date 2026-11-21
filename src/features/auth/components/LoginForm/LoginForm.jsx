import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Staff-only login form. Calls POST /api/auth/login (httpOnly cookie is set by the server).
export default function LoginForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password, remember }),
      });

      let data = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (!res.ok) {
        setError(data.message || 'Login failed. Please try again.');
        return;
      }

      navigate('/staff', { replace: true });
    } catch {
      setError('Cannot reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
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
          label="Email"
          icon="fa-solid fa-envelope"
          type="email"
          name="email"
          value={form.email}
          onChange={update}
          placeholder="Enter your email"
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

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.row}>
          <label className={styles.remember}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember Me</span>
          </label>
        </div>

        <button type="submit" className={styles.submit} disabled={loading}>
          <i className={loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-right-to-bracket'} />{' '}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}