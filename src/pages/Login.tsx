import React, { FormEvent, useState } from 'react';
import { authApi } from '../lib/api';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authApi.login(email, password);
      onLogin(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container page-shell auth-shell">
      <h1 className="section-title">Admin Login</h1>
      <p className="page-copy">Sign in to manage blog posts.</p>
      <form onSubmit={onSubmit} className="admin-form">
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
          />
        </label>
        <button className="cta" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p className="page-copy small-note">
        Seed admin credentials: <code>admin@example.com</code> / <code>change-me-admin</code>
      </p>
    </div>
  );
}
