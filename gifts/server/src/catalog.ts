import type { Gift, User } from './types';
import booksSeed from './books-seed.json';

const now = '2026-11-11T00:00:00.000Z';

export const ADMIN_EMAIL = (process.env.GIFTS_ADMIN_EMAIL || 'colinmccu@outlook.com').toLowerCase();
export const ADMIN_PASSWORD = process.env.GIFTS_ADMIN_PASSWORD || 'change-me-admin';
export const ADMIN_SALT = 'gifts-seed-v1';
export const ADMIN_DISPLAY_NAME = process.env.GIFTS_ADMIN_NAME || 'Colin';

export const SEED_ADMIN: Omit<User, 'passwordHash'> = {
  id: 1,
  email: ADMIN_EMAIL,
  displayName: ADMIN_DISPLAY_NAME,
  role: 'admin',
  status: 'approved',
  createdAt: now,
  updatedAt: now,
};

export function buildSeedGifts(ownerId: number): Gift[] {
  return (booksSeed as Array<{
    title: string;
    author: string;
    format: string;
    url: string;
    notes: string;
  }>).map((book, index) => {
    const createdAt = new Date(Date.parse(now) + index * 1000).toISOString();
    return {
      id: index + 1,
      ownerId,
      title: book.title,
      notes: book.notes,
      url: book.url || null,
      category: 'books',
      format: book.format || null,
      author: book.author || null,
      status: 'open' as const,
      purchasedById: null,
      purchasedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
  });
}
