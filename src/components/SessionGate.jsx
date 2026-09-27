import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { restoreAdminSession } from '../utils/restore-session';

// Gate both protected deep links and the login entry point before redirecting.
export default function SessionGate({ children, login = false }) {
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState('loading');
    restoreAdminSession().then(authenticated => {
      if (active) setState(authenticated ? 'authenticated' : 'anonymous');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [attempt]);
  if (state === 'loading') return <div role="status">Restoring session…</div>;
  if (state === 'error') return <div role="alert">Unable to restore your session. <button onClick={() => setAttempt(value => value + 1)}>Retry</button></div>;
  if (login) return state === 'authenticated' ? <Navigate to="/dashboard" replace /> : children;
  return state === 'authenticated' ? children : <Navigate to="/login" replace />;
}
