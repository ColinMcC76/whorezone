import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, updateMyAccount } from '../lib/api';
import type { User } from '../lib/types';

interface AccountProps {
  token: string;
  user: User;
  onUserUpdate: (user: User) => void;
  onTokenUpdate: (token: string) => void;
  onLogout: () => void;
}

export default function Account({ token, user, onUserUpdate, onTokenUpdate, onLogout }: AccountProps) {
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await authApi.getMe(token);
        if (!cancelled) {
          onUserUpdate(fresh);
          setEmail(fresh.email);
        }
      } catch {
        /* keep cached user if offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, onUserUpdate]);

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const result = await updateMyAccount(token, {
        email,
        newPassword: newPassword.trim() || undefined,
      });
      onTokenUpdate(result.token);
      onUserUpdate(result.user);
      setNewPassword('');
      setMessage('Account updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-shell auth-shell">
      <h1 className="section-title">Account</h1>
      <p className="page-copy">
        Signed in as <strong>{user.displayName}</strong> ({user.email})
      </p>
      <p className="page-copy small-note">
        Sign-in method: <code>{user.authProvider}</code>
      </p>

      {user.role === 'admin' && (
        <p className="page-copy">
          <Link to="/admin/blog">Open blog admin</Link>
        </p>
      )}

      {user.authProvider === 'local' ? (
        <form onSubmit={onSave} className="admin-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            New password (optional)
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          <button className="cta" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      ) : (
        <p className="page-copy">
          Email and password for this account are managed by {user.authProvider}. Use that provider’s
          security settings to change them.
        </p>
      )}

      {message && <p className="page-copy">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <button type="button" className="cta-outline" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}
