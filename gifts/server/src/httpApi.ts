import { z } from 'zod';
import { generateToken, verifyToken } from './tokens';
import type { AuthUser, Gift, GiftView } from './types';
import {
  createGift,
  createUser,
  findGiftById,
  findUserByEmail,
  findUserById,
  listGifts,
  listUsers,
  publicUser,
  purchaseGift,
  readyStore,
  removeGift,
  setUserStatus,
  unpurchaseGift,
  updateGift,
  verifyPassword,
} from './store';

const signupSchema = z.object({
  email: z.string().email().max(200),
  displayName: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

const giftSchema = z.object({
  title: z.string().trim().min(2).max(200),
  notes: z.string().max(2000).optional().or(z.literal('')),
  url: z.string().url().optional().or(z.literal('')).or(z.null()),
  category: z.string().trim().min(1).max(60).optional(),
  format: z.string().max(200).optional().or(z.literal('')).or(z.null()),
  author: z.string().max(200).optional().or(z.literal('')).or(z.null()),
});

const statusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

function requestPath(request: Request): string {
  const url = new URL(request.url);
  const forwarded = request.headers.get('x-forwarded-uri') ?? request.headers.get('x-invoke-path') ?? '';
  const raw = (forwarded || url.pathname).split('?')[0] || '/';
  const trimmed = raw.length > 1 ? raw.replace(/\/+$/, '') : raw;
  if (trimmed === '/api') return '/';
  if (trimmed.startsWith('/api/')) return trimmed.slice(4);
  return trimmed;
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (
    origin === 'https://gifts.mcwhorezone.com' ||
    origin === 'http://localhost:5174' ||
    origin === 'http://127.0.0.1:5174'
  ) {
    return true;
  }
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get('origin') ?? undefined;
  if (origin && isAllowedOrigin(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('access-control-allow-headers', 'Content-Type, Authorization');
    headers.set('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('vary', 'Origin');
  }
  return headers;
}

function json(request: Request, status: number, body: unknown): Response {
  const headers = corsHeaders(request);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

function validationMessage(error: z.ZodError): string {
  const flat = error.flatten();
  const lines = [...(flat.formErrors || [])];
  for (const [field, messages] of Object.entries(flat.fieldErrors || {})) {
    if (Array.isArray(messages) && messages.length) lines.push(`${field}: ${messages.join(', ')}`);
  }
  return lines.join(' ') || 'Validation failed';
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function currentUser(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) return null;
  return verifyToken(header.slice('Bearer '.length).trim());
}

function match(path: string, pattern: string): Record<string, string> | null {
  const actual = path.split('/').filter(Boolean);
  const expected = pattern.split('/').filter(Boolean);
  if (actual.length !== expected.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < expected.length; i += 1) {
    const token = expected[i];
    if (token.startsWith(':')) params[token.slice(1)] = decodeURIComponent(actual[i]);
    else if (token !== actual[i]) return null;
  }
  return params;
}

function toGiftView(gift: Gift, viewer: AuthUser): GiftView {
  const owner = findUserById(gift.ownerId);
  const buyer = gift.purchasedById != null ? findUserById(gift.purchasedById) : null;
  const canSeeBuyer =
    viewer.role === 'admin' || (gift.purchasedById != null && gift.purchasedById === viewer.id);
  return {
    ...gift,
    ownerName: owner?.displayName ?? 'Unknown',
    purchasedById: canSeeBuyer ? gift.purchasedById : gift.status === 'purchased' ? -1 : null,
    purchasedByName: canSeeBuyer ? buyer?.displayName ?? null : gift.status === 'purchased' ? null : null,
  };
}

export async function handleApi(request: Request): Promise<Response> {
  const origin = request.headers.get('origin') ?? undefined;
  if (origin && !isAllowedOrigin(origin)) {
    return json(request, 403, { error: 'Not allowed by CORS' });
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  await readyStore();
  const path = requestPath(request);
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === 'GET' && path === '/health') {
    return json(request, 200, { ok: true });
  }

  if (method === 'POST' && path === '/auth/register') {
    const body = await readJson(request);
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
    if (findUserByEmail(parsed.data.email)) {
      return json(request, 409, { error: 'An account with that email already exists.' });
    }
    const user = await createUser(parsed.data);
    return json(request, 201, {
      user: publicUser(user),
      message: 'Account created. An admin must approve you before you can sign in.',
    });
  }

  if (method === 'POST' && path === '/auth/login') {
    const body = await readJson(request);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
    const user = findUserByEmail(parsed.data.email);
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return json(request, 401, { error: 'Invalid credentials' });
    }
    if (user.status === 'pending') {
      return json(request, 403, { error: 'Your account is awaiting approval.' });
    }
    if (user.status === 'rejected') {
      return json(request, 403, { error: 'Your account request was rejected.' });
    }
    const token = await generateToken(publicUser(user));
    return json(request, 200, { token, user: publicUser(user) });
  }

  if (method === 'GET' && path === '/auth/me') {
    const auth = await currentUser(request);
    if (!auth) return json(request, 401, { error: 'Unauthorized' });
    const user = findUserById(auth.id);
    if (!user || user.status !== 'approved') return json(request, 401, { error: 'Unauthorized' });
    return json(request, 200, { user: publicUser(user) });
  }

  if (method === 'GET' && path === '/users') {
    const auth = await currentUser(request);
    if (!auth || auth.status !== 'approved') return json(request, 401, { error: 'Unauthorized' });
    return json(
      request,
      200,
      listUsers().filter((user) => user.status === 'approved'),
    );
  }

  if (path === '/admin/users' || path.startsWith('/admin/users/')) {
    const auth = await currentUser(request);
    if (!auth) return json(request, 401, { error: 'Unauthorized' });
    if (auth.role !== 'admin') return json(request, 403, { error: 'Forbidden' });

    if (method === 'GET' && path === '/admin/users') {
      return json(request, 200, listUsers());
    }

    const idMatch = match(path, '/admin/users/:id');
    if (method === 'PATCH' && idMatch) {
      const id = Number(idMatch.id);
      const body = await readJson(request);
      const parsed = statusSchema.safeParse(body);
      if (!Number.isFinite(id)) return json(request, 400, { error: 'Invalid user id' });
      if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
      const updated = await setUserStatus(id, parsed.data.status);
      if (!updated) return json(request, 404, { error: 'User not found' });
      return json(request, 200, { user: publicUser(updated) });
    }
  }

  if (method === 'GET' && path === '/gifts') {
    const auth = await currentUser(request);
    if (!auth || auth.status !== 'approved') return json(request, 401, { error: 'Unauthorized' });
    const ownerIdRaw = url.searchParams.get('ownerId');
    const category = url.searchParams.get('category') || undefined;
    const status = url.searchParams.get('status');
    const ownerId = ownerIdRaw ? Number(ownerIdRaw) : undefined;
    const gifts = listGifts({
      ownerId: ownerId != null && Number.isFinite(ownerId) ? ownerId : undefined,
      category,
      status: status === 'open' || status === 'purchased' ? status : undefined,
    }).map((gift) => toGiftView(gift, auth));
    return json(request, 200, gifts);
  }

  if (method === 'POST' && path === '/gifts') {
    const auth = await currentUser(request);
    if (!auth || auth.status !== 'approved') return json(request, 401, { error: 'Unauthorized' });
    const body = await readJson(request);
    const parsed = giftSchema.safeParse(body);
    if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
    const created = await createGift({
      ownerId: auth.id,
      title: parsed.data.title,
      notes: parsed.data.notes,
      url: parsed.data.url,
      category: parsed.data.category,
      format: parsed.data.format,
      author: parsed.data.author,
    });
    return json(request, 201, toGiftView(created, auth));
  }

  const giftMatch = match(path, '/gifts/:id');
  if (giftMatch) {
    const id = Number(giftMatch.id);
    if (!Number.isFinite(id)) return json(request, 400, { error: 'Invalid gift id' });
    const auth = await currentUser(request);
    if (!auth || auth.status !== 'approved') return json(request, 401, { error: 'Unauthorized' });
    const existing = findGiftById(id);
    if (!existing) return json(request, 404, { error: 'Gift not found' });

    if (method === 'PATCH') {
      if (existing.ownerId !== auth.id && auth.role !== 'admin') {
        return json(request, 403, { error: 'You can only edit your own gifts.' });
      }
      const body = await readJson(request);
      const parsed = giftSchema.safeParse(body);
      if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
      const updated = await updateGift(id, parsed.data);
      if (!updated) return json(request, 400, { error: 'Purchased gifts cannot be edited.' });
      return json(request, 200, toGiftView(updated, auth));
    }

    if (method === 'DELETE') {
      if (existing.ownerId !== auth.id && auth.role !== 'admin') {
        return json(request, 403, { error: 'You can only delete your own gifts.' });
      }
      const deleted = await removeGift(id);
      if (!deleted) return json(request, 404, { error: 'Gift not found' });
      return json(request, 200, { ok: true });
    }
  }

  const purchaseMatch = match(path, '/gifts/:id/purchase');
  if (method === 'POST' && purchaseMatch) {
    const id = Number(purchaseMatch.id);
    const auth = await currentUser(request);
    if (!auth || auth.status !== 'approved') return json(request, 401, { error: 'Unauthorized' });
    const existing = findGiftById(id);
    if (!existing) return json(request, 404, { error: 'Gift not found' });
    if (existing.ownerId === auth.id) {
      return json(request, 400, { error: 'You cannot mark your own gift as purchased.' });
    }
    if (existing.status === 'purchased') {
      return json(request, 409, { error: 'This gift was already purchased.' });
    }
    const purchased = await purchaseGift(id, auth.id);
    if (!purchased) return json(request, 409, { error: 'Unable to claim this gift.' });
    return json(request, 200, toGiftView(purchased, auth));
  }

  const unpurchaseMatch = match(path, '/gifts/:id/unpurchase');
  if (method === 'POST' && unpurchaseMatch) {
    const id = Number(unpurchaseMatch.id);
    const auth = await currentUser(request);
    if (!auth || auth.status !== 'approved') return json(request, 401, { error: 'Unauthorized' });
    const existing = findGiftById(id);
    if (!existing) return json(request, 404, { error: 'Gift not found' });
    if (auth.role !== 'admin' && existing.purchasedById !== auth.id) {
      return json(request, 403, { error: 'Only the purchaser or an admin can undo this.' });
    }
    const opened = await unpurchaseGift(id);
    if (!opened) return json(request, 404, { error: 'Gift not found' });
    return json(request, 200, toGiftView(opened, auth));
  }

  return json(request, 404, { error: 'Not found', path });
}
