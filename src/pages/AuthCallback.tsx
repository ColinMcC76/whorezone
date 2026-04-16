import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import type { User } from '../lib/types';

interface AuthCallbackProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export default function AuthCallback({ onAuthSuccess }: AuthCallbackProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing sign-in…');

  useEffect(() => {
    const ticket = searchParams.get('ticket');
    const oauthError = searchParams.get('oauth_error');
    if (oauthError) {
      setMessage(oauthError);
      return;
    }
    if (!ticket) {
      setMessage('Missing sign-in ticket. Try signing in again.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await authApi.consumeOAuthTicket(ticket);
        if (cancelled) return;
        onAuthSuccess(result.token, result.user);
        navigate('/', { replace: true });
      } catch (err) {
        if (cancelled) return;
        setMessage(err instanceof Error ? err.message : 'Sign-in failed.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, onAuthSuccess]);

  return (
    <div className="container page-shell auth-shell">
      <h1 className="section-title">Sign-in</h1>
      <p className="page-copy">{message}</p>
    </div>
  );
}
