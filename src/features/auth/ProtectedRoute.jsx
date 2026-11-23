import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ALLOWED = ['admin', 'staff'];

// Asks the server who is signed in (cookie is httpOnly, so JS can't read it).
export default function ProtectedRoute() {
  const [status, setStatus] = useState('loading'); // loading | ok | denied

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return alive && setStatus('denied');
        const data = await res.json();
        if (alive) setStatus(ALLOWED.includes(data.user?.role) ? 'ok' : 'denied');
      })
      .catch(() => alive && setStatus('denied'));
    return () => { alive = false; };
  }, []);

  if (status === 'loading') return null;
  if (status === 'denied') return <Navigate to="/login" replace />;
  return <Outlet />;
}