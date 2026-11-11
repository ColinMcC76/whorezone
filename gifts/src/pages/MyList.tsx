import React, { FormEvent, useEffect, useState } from 'react';
import GiftCard from '../components/GiftCard';
import { createGift, deleteGift, listGifts, updateGift } from '../lib/api';
import type { GiftView, PublicUser } from '../lib/types';

type Props = {
  token: string;
  user: PublicUser;
};

const emptyForm = {
  title: '',
  author: '',
  format: '',
  category: 'general',
  url: '',
  notes: '',
};

export default function MyList({ token, user }: Props) {
  const [gifts, setGifts] = useState<GiftView[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const rows = await listGifts(token, { ownerId: user.id });
    setGifts(rows);
  };

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'));
  }, [token, user.id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        author: form.author || undefined,
        format: form.format || undefined,
        category: form.category || 'general',
        url: form.url || undefined,
        notes: form.notes || undefined,
      };
      if (editingId != null) await updateGift(token, editingId, payload);
      else await createGift(token, payload);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (gift: GiftView) => {
    setEditingId(gift.id);
    setForm({
      title: gift.title,
      author: gift.author || '',
      format: gift.format || '',
      category: gift.category || 'general',
      url: gift.url || '',
      notes: gift.notes || '',
    });
  };

  const onDelete = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await deleteGift(token, id);
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <section className="chapter">
        <p className="chapter-eyebrow">Yours</p>
        <h1 className="chapter-title">My list</h1>
        <p className="chapter-lead">Add, edit, or remove gifts on your wishlist.</p>
        <div className="chapter-body">
          <form className="admin-form" onSubmit={onSubmit}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                minLength={2}
              />
            </label>
            <label>
              Author
              <input
                value={form.author}
                onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
              />
            </label>
            <label>
              Format / details
              <input
                value={form.format}
                onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}
              />
            </label>
            <label>
              Category
              <input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              />
            </label>
            <label>
              Link
              <input
                type="url"
                value={form.url}
                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://"
              />
            </label>
            <label>
              Notes
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
            <div className="admin-form-actions">
              <button className="cta" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId != null ? 'Save changes' : 'Add gift'}
              </button>
              {editingId != null ? (
                <button
                  type="button"
                  className="cta-outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        </div>
      </section>

      <div className="gift-grid">
        {gifts.map((gift) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            user={user}
            busyId={busyId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
