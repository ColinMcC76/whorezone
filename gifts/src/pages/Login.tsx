import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../lib/api';
import type { PublicUser } from '../lib/types';

type Props = {
  onAuth: (token: string, user: PublicUser) => void;
};

export default function Login({ onAuth }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await login(email, password);
      onAuth(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <section className="chapter">
        <p className="chapter-eyebrow">Family access</p>
        <h1 className="chapter-title">Sign in</h1>
        <p className="chapter-lead">Approved family accounts can view lists and claim gifts.</p>
        <div className="chapter-body">
          <form className="admin-form" onSubmit={onSubmit}>
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
              />
            </label>
            <div className="admin-form-actions">
              <button className="cta" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
          <p className="meta" style={{ textAlign: 'center', marginTop: '1rem' }}>
            Need access? <Link to="/register">Request an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
