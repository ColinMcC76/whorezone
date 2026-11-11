import React, { useEffect, useState } from 'react';
import { listAdminUsers, setUserStatus } from '../lib/api';
import type { PublicUser } from '../lib/types';

type Props = {
  token: string;
};

export default function Admin({ token }: Props) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    const rows = await listAdminUsers(token);
    setUsers(rows);
  };

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users.'));
  }, [token]);

  const updateStatus = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
    setBusyId(id);
    setError(null);
    try {
      await setUserStatus(token, id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const pending = users.filter((user) => user.status === 'pending');
  const others = users.filter((user) => user.status !== 'pending');

  return (
    <div className="page">
      <section className="chapter">
        <p className="chapter-eyebrow">Approvals</p>
        <h1 className="chapter-title">Admin</h1>
        <p className="chapter-lead">Approve family account requests before they can sign in.</p>
        <div className="chapter-body">
          {error ? <p className="form-error">{error}</p> : null}

          <h3 style={{ marginBottom: '0.75rem' }}>Pending</h3>
          {pending.length === 0 ? (
            <p className="meta">No pending requests.</p>
          ) : (
            pending.map((user) => (
              <div className="user-row" key={user.id}>
                <div>
                  <strong>{user.displayName}</strong>
                  <p className="meta">
                    {user.email} · {user.status}
                  </p>
                </div>
                <div className="gift-actions">
                  <button
                    type="button"
                    className="cta"
                    disabled={busyId === user.id}
                    onClick={() => updateStatus(user.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="cta-outline"
                    disabled={busyId === user.id}
                    onClick={() => updateStatus(user.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}

          <h3 style={{ margin: '1.5rem 0 0.75rem' }}>Everyone</h3>
          {others.map((user) => (
            <div className="user-row" key={user.id}>
              <div>
                <strong>{user.displayName}</strong>
                <p className="meta">
                  {user.email} · {user.role} · {user.status}
                </p>
              </div>
              {user.role !== 'admin' ? (
                <div className="gift-actions">
                  {user.status !== 'approved' ? (
                    <button
                      type="button"
                      className="cta-outline"
                      disabled={busyId === user.id}
                      onClick={() => updateStatus(user.id, 'approved')}
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="cta-outline"
                      disabled={busyId === user.id}
                      onClick={() => updateStatus(user.id, 'rejected')}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
