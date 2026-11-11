import {
  ADMIN_PASSWORD,
  ADMIN_SALT,
  SEED_ADMIN,
  buildSeedGifts,
} from './catalog';
import type { Gift, GiftStatus, PublicUser, User, UserStatus } from './types';

const BLOB_PATH = 'mcwhorezone/gifts.json';

let users: User[] = [];
let gifts: Gift[] = [];
let nextUserId = 2;
let nextGiftId = 1;
let ready: Promise<void> | null = null;

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 10000, hash: 'SHA-256' },
    key,
    256,
  );
  const hex = [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${salt}$${hex}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [scheme, salt, hex] = passwordHash.split('$');
  if (scheme !== 'pbkdf2' || !salt || !hex) return false;
  const actual = await hashPassword(password, salt);
  return actual === `pbkdf2$${salt}$${hex}`;
}

function reindex(): void {
  nextUserId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  nextGiftId = gifts.reduce((max, gift) => Math.max(max, gift.id), 0) + 1;
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function seed(): Promise<void> {
  const admin: User = {
    ...SEED_ADMIN,
    passwordHash: await hashPassword(ADMIN_PASSWORD, ADMIN_SALT),
  };
  users = [admin];
  gifts = buildSeedGifts(admin.id);
  reindex();
}

function ensureAdminAndBooks(): boolean {
  let changed = false;
  const adminEmail = SEED_ADMIN.email.toLowerCase();
  let admin = users.find((user) => user.email.toLowerCase() === adminEmail);
  if (!admin) {
    admin = {
      ...SEED_ADMIN,
      passwordHash: users[0]?.passwordHash || '',
    };
    users.unshift(admin);
    changed = true;
  }
  if (admin.role !== 'admin' || admin.status !== 'approved') {
    admin.role = 'admin';
    admin.status = 'approved';
    changed = true;
  }
  const hasBooks = gifts.some((gift) => gift.ownerId === admin!.id && gift.category === 'books');
  if (!hasBooks) {
    const seeded = buildSeedGifts(admin.id);
    const offset = nextGiftId;
    for (const gift of seeded) {
      gift.id = offset + gift.id - 1;
      gifts.push(gift);
    }
    changed = true;
  }
  if (changed) reindex();
  return changed;
}

async function restoreFromBlob(): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;
  const { get } = await import('@vercel/blob');
  const result = await get(BLOB_PATH, { access: 'private', token, useCache: false });
  if (!result?.stream) return;
  const parsed = JSON.parse(await new Response(result.stream).text()) as {
    users?: User[];
    gifts?: Gift[];
  };
  if (!Array.isArray(parsed.users) || parsed.users.length === 0) return;
  users = parsed.users.map((user) => ({ ...user }));
  gifts = Array.isArray(parsed.gifts) ? parsed.gifts.map((gift) => ({ ...gift })) : [];
  reindex();
  if (ensureAdminAndBooks()) await persistStore();
}

export async function persistStore(): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;
  try {
    const { put } = await import('@vercel/blob');
    await withTimeout(
      put(BLOB_PATH, JSON.stringify({ users, gifts }), {
        access: 'private',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      }),
      4000,
    );
  } catch (error) {
    console.error('Gifts store save skipped', error);
  }
}

export function readyStore(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await seed();
      try {
        await withTimeout(restoreFromBlob(), 1200);
      } catch (error) {
        console.error('Gifts store restore skipped', error);
      }
    })();
  }
  return ready;
}

export function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
}

export function findUserById(id: number): User | null {
  return users.find((user) => user.id === id) ?? null;
}

export function findUserByEmail(email: string): User | null {
  const needle = email.toLowerCase();
  return users.find((user) => user.email.toLowerCase() === needle) ?? null;
}

export function listUsers(): PublicUser[] {
  return [...users]
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(publicUser);
}

export async function createUser(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<User> {
  const now = new Date().toISOString();
  const user: User = {
    id: nextUserId,
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    passwordHash: await hashPassword(input.password, `user-${nextUserId}-${now}`),
    role: 'member',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  nextUserId += 1;
  users.push(user);
  await persistStore();
  return user;
}

export async function setUserStatus(id: number, status: UserStatus): Promise<User | null> {
  const user = findUserById(id);
  if (!user) return null;
  if (user.role === 'admin' && status !== 'approved') return user;
  user.status = status;
  user.updatedAt = new Date().toISOString();
  await persistStore();
  return user;
}

export function listGifts(filters?: {
  ownerId?: number;
  category?: string;
  status?: GiftStatus;
}): Gift[] {
  return gifts
    .filter((gift) => {
      if (filters?.ownerId != null && gift.ownerId !== filters.ownerId) return false;
      if (filters?.category && gift.category !== filters.category) return false;
      if (filters?.status && gift.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findGiftById(id: number): Gift | null {
  return gifts.find((gift) => gift.id === id) ?? null;
}

export async function createGift(input: {
  ownerId: number;
  title: string;
  notes?: string;
  url?: string | null;
  category?: string;
  format?: string | null;
  author?: string | null;
}): Promise<Gift> {
  const now = new Date().toISOString();
  const gift: Gift = {
    id: nextGiftId,
    ownerId: input.ownerId,
    title: input.title,
    notes: input.notes?.trim() || '',
    url: input.url?.trim() || null,
    category: input.category?.trim() || 'general',
    format: input.format?.trim() || null,
    author: input.author?.trim() || null,
    status: 'open',
    purchasedById: null,
    purchasedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  nextGiftId += 1;
  gifts.push(gift);
  await persistStore();
  return gift;
}

export async function updateGift(
  id: number,
  input: {
    title: string;
    notes?: string;
    url?: string | null;
    category?: string;
    format?: string | null;
    author?: string | null;
  },
): Promise<Gift | null> {
  const gift = findGiftById(id);
  if (!gift) return null;
  if (gift.status === 'purchased') return null;
  gift.title = input.title;
  gift.notes = input.notes?.trim() || '';
  gift.url = input.url?.trim() || null;
  gift.category = input.category?.trim() || gift.category;
  gift.format = input.format?.trim() || null;
  gift.author = input.author?.trim() || null;
  gift.updatedAt = new Date().toISOString();
  await persistStore();
  return gift;
}

export async function removeGift(id: number): Promise<boolean> {
  const before = gifts.length;
  gifts = gifts.filter((gift) => gift.id !== id);
  if (gifts.length === before) return false;
  await persistStore();
  return true;
}

export async function purchaseGift(id: number, buyerId: number): Promise<Gift | null> {
  const gift = findGiftById(id);
  if (!gift) return null;
  if (gift.ownerId === buyerId) return null;
  if (gift.status === 'purchased') return null;
  gift.status = 'purchased';
  gift.purchasedById = buyerId;
  gift.purchasedAt = new Date().toISOString();
  gift.updatedAt = gift.purchasedAt;
  await persistStore();
  return gift;
}

export async function unpurchaseGift(id: number): Promise<Gift | null> {
  const gift = findGiftById(id);
  if (!gift) return null;
  gift.status = 'open';
  gift.purchasedById = null;
  gift.purchasedAt = null;
  gift.updatedAt = new Date().toISOString();
  await persistStore();
  return gift;
}

/** Reset in-memory store between tests. */
export async function resetStoreForTests(): Promise<void> {
  ready = null;
  await readyStore();
}
