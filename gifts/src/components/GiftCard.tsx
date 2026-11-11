import React from 'react';
import type { GiftView, PublicUser } from '../lib/types';

type Props = {
  gift: GiftView;
  user: PublicUser;
  onPurchase?: (id: number) => void;
  onUnpurchase?: (id: number) => void;
  onEdit?: (gift: GiftView) => void;
  onDelete?: (id: number) => void;
  busyId?: number | null;
};

export default function GiftCard({
  gift,
  user,
  onPurchase,
  onUnpurchase,
  onEdit,
  onDelete,
  busyId,
}: Props) {
  const isOwner = gift.ownerId === user.id;
  const isPurchaser = gift.purchasedById === user.id;
  const canPurchase = !isOwner && gift.status === 'open';
  const canUnpurchase =
    gift.status === 'purchased' && (user.role === 'admin' || isPurchaser);

  return (
    <article className={`gift-card ${gift.status === 'purchased' ? 'purchased' : ''}`}>
      <span className={`badge ${gift.status}`}>{gift.status}</span>
      <h3>{gift.title}</h3>
      {gift.author ? <p className="meta">by {gift.author}</p> : null}
      <p className="meta">
        For {gift.ownerName}
        {gift.category ? ` · ${gift.category}` : ''}
        {gift.format ? ` · ${gift.format}` : ''}
      </p>
      {gift.notes ? <p>{gift.notes}</p> : null}
      {gift.status === 'purchased' ? (
        <p className="meta">
          {gift.purchasedByName
            ? `Purchased by ${gift.purchasedByName}`
            : 'Purchased (buyer hidden)'}
        </p>
      ) : null}
      <div className="gift-actions">
        {gift.url ? (
          <a className="cta-outline" href={gift.url} target="_blank" rel="noopener noreferrer">
            Open link
          </a>
        ) : null}
        {canPurchase && onPurchase ? (
          <button
            type="button"
            className="cta"
            disabled={busyId === gift.id}
            onClick={() => onPurchase(gift.id)}
          >
            Mark purchased
          </button>
        ) : null}
        {canUnpurchase && onUnpurchase ? (
          <button
            type="button"
            className="cta-outline"
            disabled={busyId === gift.id}
            onClick={() => onUnpurchase(gift.id)}
          >
            Undo purchase
          </button>
        ) : null}
        {isOwner && gift.status === 'open' && onEdit ? (
          <button type="button" className="cta-outline" onClick={() => onEdit(gift)}>
            Edit
          </button>
        ) : null}
        {isOwner && onDelete ? (
          <button
            type="button"
            className="cta-outline"
            disabled={busyId === gift.id}
            onClick={() => onDelete(gift.id)}
          >
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}
