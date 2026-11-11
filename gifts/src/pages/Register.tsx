import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../lib/api';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await register({ displayName, email, password });
      setMessage(result.message);
      setDisplayName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <section className="chapter">
        <p className="chapter-eyebrow">Join the list</p>
        <h1 className="chapter-title">Request access</h1>
        <p className="chapter-lead">
          Create an account. An admin will approve you before you can sign in and manage gifts.
        </p>
        <div className="chapter-body">
          {message ? (
            <p className="success-message" style={{ textAlign: 'center' }}>
              {message} You can <Link to="/login">sign in</Link> after approval.
            </p>
          ) : (
            <form className="admin-form" onSubmit={onSubmit}>
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
                  {busy ? 'Sending…' : 'Request access'}
                </button>
              </div>
              {error ? <p className="form-error">{error}</p> : null}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
