import React, { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_ORIGIN, authApi } from '../lib/api';
import type { User } from '../lib/types';

interface LoginProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleStartUrl = useMemo(() => `${API_ORIGIN}/api/auth/oauth/google/start`, []);
  const discordStartUrl = useMemo(() => `${API_ORIGIN}/api/auth/oauth/discord/start`, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const result = await authApi.register({ email, password, displayName });
        onAuthSuccess(result.token, result.user);
      } else {
        const result = await authApi.login(email, password);
        onAuthSuccess(result.token, result.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container page-shell auth-shell">
      <h1 className="section-title">{mode === 'register' ? 'Create account' : 'Sign in'}</h1>
      <p className="page-copy">
        {mode === 'register'
          ? 'Passwords are hashed on the server — plain text passwords are never stored.'
          : 'Welcome back. Use email/password or a linked provider.'}
      </p>

      <div className="oauth-row">
        <a className="cta-outline oauth-btn" href={googleStartUrl}>
          Continue with Google
        </a>
        <a className="cta-outline oauth-btn" href={discordStartUrl}>
          Continue with Discord
        </a>
      </div>
      <p className="page-copy small-note">
        OAuth requires API env vars on the server (see README). If a button errors, configure Google/Discord
        credentials in Render first.
      </p>

      <form onSubmit={onSubmit} className="admin-form">
        {mode === 'register' && (
          <label>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        </label>
        <button className="cta" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'register'
              ? 'Creating account…'
              : 'Signing in…'
            : mode === 'register'
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <p className="page-copy small-note">
        {mode === 'register' ? (
          <>
            Already have an account? <Link to="/login">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link to="/login?mode=register">Create an account</Link>
          </>
        )}
      </p>

      {mode === 'login' && (
        <p className="page-copy small-note">
          Blog admin uses the seeded account: <code>admin@example.com</code> / <code>change-me-admin</code>{' '}
          (change this password in production).
        </p>
      )}
    </div>
  );
}
