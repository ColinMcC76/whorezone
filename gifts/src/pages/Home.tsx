import React, { useEffect, useMemo, useState } from 'react';
import GiftCard from '../components/GiftCard';
import { listApprovedUsers, listGifts, purchaseGift, unpurchaseGift } from '../lib/api';
import type { GiftView, PublicUser } from '../lib/types';

type Props = {
  token: string;
  user: PublicUser;
};

export default function Home({ token, user }: Props) {
  const [gifts, setGifts] = useState<GiftView[]>([]);
  const [people, setPeople] = useState<PublicUser[]>([]);
  const [ownerId, setOwnerId] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('open');
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [giftRows, userRows] = await Promise.all([
        listGifts(token, {
          ownerId: ownerId === 'all' ? undefined : Number(ownerId),
          category: category === 'all' ? undefined : category,
          status: status === 'all' ? undefined : status,
        }),
        listApprovedUsers(token),
      ]);
      setGifts(giftRows);
      setPeople(userRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gifts.');
    }
  };

  useEffect(() => {
    void load();
  }, [token, ownerId, category, status]);

  const categories = useMemo(() => {
    const set = new Set(gifts.map((gift) => gift.category).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [gifts]);

  const sorted = useMemo(() => {
    const rows = [...gifts];
    if (sort === 'title') rows.sort((a, b) => a.title.localeCompare(b.title));
    else rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows;
  }, [gifts, sort]);

  const onPurchase = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await purchaseGift(token, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim gift.');
    } finally {
      setBusyId(null);
    }
  };

  const onUnpurchase = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await unpurchaseGift(token, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not undo purchase.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <section className="chapter">
        <p className="chapter-eyebrow">Holiday lists</p>
        <h1 className="chapter-title">Wishlists</h1>
        <p className="chapter-lead">
          Browse family gifts, sort what you need, and mark something purchased so nobody doubles up.
        </p>
      </section>

      <div className="filters">
        <label>
          Person
          <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
            <option value="all">Everyone</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All categories' : item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="purchased">Purchased</option>
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {sorted.length === 0 ? (
        <p className="meta" style={{ textAlign: 'center' }}>
          No gifts match these filters.
        </p>
      ) : (
        <div className="gift-grid">
          {sorted.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              user={user}
              busyId={busyId}
              onPurchase={onPurchase}
              onUnpurchase={onUnpurchase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
