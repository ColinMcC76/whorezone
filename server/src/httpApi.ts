import { z } from 'zod';
import type { AuthUser } from './tokens';
import { generateToken, verifyToken } from './tokens';
import {
  getDiscordAuthUrl,
  getGoogleAuthUrl,
  oauthCallback,
  signOAuthState,
  verifyOAuthState,
} from './oauth';
import { consumeOAuthTicket, issueOAuthTicket } from './oauthTickets';
import {
  createPost,
  createUser,
  findPostById,
  findPublishedPostBySlug,
  findUserByEmail,
  findUserById,
  listAllPosts,
  listPublishedPosts,
  readyStore,
  removePost,
  updatePost,
  updateUserCredentials,
  verifyPassword,
} from './store';

const optionalCoverUrl = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.string().url().optional(),
);

const postPayloadSchema = z.object({
  slug: z.string().min(2).max(120).optional(),
  title: z.string().min(2).max(180),
  summary: z.string().min(10).max(500),
  content: z.string().min(10),
  coverImageUrl: optionalCoverUrl,
  status: z.enum(['draft', 'published']).default('draft'),
});

const signupSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80),
  password: z.string().min(8).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

const updateProfileSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8).max(120).optional().or(z.literal('')),
});

const oauthConsumeSchema = z.object({
  ticket: z.string().min(10).max(500),
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
    origin === 'https://mcwhorezone.com' ||
    origin === 'https://www.mcwhorezone.com' ||
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:5173'
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

function redirect(request: Request, location: string): Response {
  const headers = corsHeaders(request);
  headers.set('location', location);
  return new Response(null, { status: 302, headers });
}

function validationMessage(error: z.ZodError): string {
  const flat = error.flatten();
  const lines = [...(flat.formErrors || [])];
  for (const [field, messages] of Object.entries(flat.fieldErrors || {})) {
    if (Array.isArray(messages) && messages.length) lines.push(`${field}: ${messages.join(', ')}`);
  }
  return lines.join(' ') || 'Validation failed';
}

function publicUser(user: {
  id: number;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  authProvider: 'local' | 'google' | 'discord';
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    authProvider: user.authProvider,
  };
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

function toSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `post-${Date.now()}`;
}

function frontendOAuthBase(): string {
  const configured = process.env.FRONTEND_OAUTH_REDIRECT_URL?.trim();
  if (configured) return configured;
  if (process.env.VERCEL) return 'https://www.mcwhorezone.com/#/auth/callback';
  return 'http://localhost:5173/#/auth/callback';
}

function withQuery(base: string, key: string, value: string): string {
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}${key}=${encodeURIComponent(value)}`;
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

  if (method === 'GET' && path === '/health') {
    return json(request, 200, { ok: true });
  }

  if (method === 'GET' && (path === '/posts' || path === '/blog/posts')) {
    return json(request, 200, listPublishedPosts());
  }

  const publicPost = match(path, '/posts/:slug') ?? match(path, '/blog/posts/:slug');
  if (method === 'GET' && publicPost && !path.startsWith('/admin')) {
    const post = findPublishedPostBySlug(publicPost.slug);
    if (!post) return json(request, 404, { error: 'Post not found' });
    return json(request, 200, post);
  }

  if (method === 'POST' && path === '/auth/register') {
    const body = await readJson(request);
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
    if (findUserByEmail(parsed.data.email)) return json(request, 409, { error: 'User already exists' });
    const user = await createUser({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      role: 'user',
      password: parsed.data.password,
    });
    const token = await generateToken(user);
    return json(request, 201, { token, user: publicUser(user) });
  }

  if (method === 'POST' && path === '/auth/login') {
    const body = await readJson(request);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
    const user = findUserByEmail(parsed.data.email);
    if (!user) return json(request, 401, { error: 'Invalid credentials' });
    if (user.authProvider !== 'local') {
      return json(request, 400, {
        error: `This account uses ${user.authProvider} sign-in. Please use that provider instead.`,
      });
    }
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return json(request, 401, { error: 'Invalid credentials' });
    }
    const token = await generateToken(user);
    return json(request, 200, { token, user: publicUser(user) });
  }

  if (method === 'GET' && path === '/auth/me') {
    const auth = await currentUser(request);
    if (!auth) return json(request, 401, { error: 'Unauthorized' });
    const user = findUserById(auth.id);
    if (!user) return json(request, 404, { error: 'User not found' });
    return json(request, 200, { user: publicUser(user) });
  }

  if (method === 'PATCH' && path === '/auth/me') {
    const auth = await currentUser(request);
    if (!auth) return json(request, 401, { error: 'Unauthorized' });
    const body = await readJson(request);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
    const current = findUserById(auth.id);
    if (!current) return json(request, 404, { error: 'User not found' });
    if (current.authProvider !== 'local') {
      return json(request, 400, {
        error: 'Password changes for OAuth accounts must be done through your Google or Discord account.',
      });
    }
    const emailInUse = findUserByEmail(parsed.data.email);
    if (emailInUse && emailInUse.id !== auth.id) return json(request, 409, { error: 'Email is already in use' });
    const updated = await updateUserCredentials({
      id: auth.id,
      email: parsed.data.email,
      password: parsed.data.newPassword || undefined,
    });
    if (!updated) return json(request, 500, { error: 'Failed to update profile' });
    const token = await generateToken(updated);
    return json(request, 200, { token, user: publicUser(updated) });
  }

  const oauthStart = match(path, '/auth/oauth/:provider/start');
  if (method === 'GET' && oauthStart) {
    const provider = oauthStart.provider;
    if (provider !== 'google' && provider !== 'discord') return json(request, 404, { error: 'Unknown provider' });
    const stateToken = signOAuthState({
      provider,
      nonce: crypto.randomUUID().replace(/-/g, ''),
      exp: Date.now() + 10 * 60 * 1000,
    });
    try {
      const url = provider === 'google' ? getGoogleAuthUrl(stateToken) : getDiscordAuthUrl(stateToken);
      return redirect(request, url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth is not configured';
      return json(request, 503, { error: message });
    }
  }

  if (method === 'GET' && path === '/auth/oauth/callback') {
    const url = new URL(request.url);
    const err = url.searchParams.get('error');
    if (err) return redirect(request, withQuery(frontendOAuthBase(), 'oauth_error', 'Sign-in was cancelled or denied.'));
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) {
      return redirect(request, withQuery(frontendOAuthBase(), 'oauth_error', 'Missing OAuth parameters.'));
    }
    const statePayload = verifyOAuthState(state);
    if (!statePayload) {
      return redirect(request, withQuery(frontendOAuthBase(), 'oauth_error', 'Invalid or expired OAuth state.'));
    }
    try {
      const result = await oauthCallback(statePayload.provider, code);
      const ticket = issueOAuthTicket(result.token, result.user);
      return redirect(request, withQuery(frontendOAuthBase(), 'ticket', ticket));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth sign-in failed';
      return redirect(request, withQuery(frontendOAuthBase(), 'oauth_error', message));
    }
  }

  if (method === 'POST' && path === '/auth/oauth/consume') {
    const body = await readJson(request);
    const parsed = oauthConsumeSchema.safeParse(body);
    if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
    const consumed = consumeOAuthTicket(parsed.data.ticket);
    if (!consumed) return json(request, 400, { error: 'Invalid or expired sign-in ticket' });
    return json(request, 200, consumed);
  }

  if (path === '/admin/posts' || path.startsWith('/admin/posts/')) {
    const auth = await currentUser(request);
    if (!auth) return json(request, 401, { error: 'Unauthorized' });
    if (auth.role !== 'admin') return json(request, 403, { error: 'Forbidden' });

    if (method === 'GET' && path === '/admin/posts') return json(request, 200, listAllPosts());

    if (method === 'POST' && path === '/admin/posts') {
      const body = await readJson(request);
      const parsed = postPayloadSchema.safeParse(body);
      if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
      const created = await createPost({
        ...parsed.data,
        slug: parsed.data.slug ?? toSlug(parsed.data.title),
        coverImageUrl: parsed.data.coverImageUrl ?? null,
        publishedAt: parsed.data.status === 'published' ? new Date().toISOString() : null,
        authorId: auth.id,
      });
      return json(request, 201, created);
    }

    const statusMatch = match(path, '/admin/posts/:id/status');
    if (method === 'PATCH' && statusMatch) {
      const id = Number(statusMatch.id);
      const body = await readJson(request);
      const parsed = z.object({ status: z.enum(['draft', 'published']) }).safeParse(body);
      if (!Number.isFinite(id)) return json(request, 400, { error: 'Invalid post id' });
      if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
      const existing = findPostById(id);
      if (!existing) return json(request, 404, { error: 'Post not found' });
      const updated = await updatePost(id, {
        slug: existing.slug,
        title: existing.title,
        summary: existing.summary,
        content: existing.content,
        coverImageUrl: existing.coverImageUrl,
        status: parsed.data.status,
        publishedAt: parsed.data.status === 'published' ? existing.publishedAt ?? new Date().toISOString() : null,
      });
      return json(request, 200, updated);
    }

    const idMatch = match(path, '/admin/posts/:id');
    if (idMatch) {
      const id = Number(idMatch.id);
      if (!Number.isFinite(id)) return json(request, 400, { error: 'Invalid post id' });
      if (method === 'PUT') {
        const body = await readJson(request);
        const parsed = postPayloadSchema.safeParse(body);
        if (!parsed.success) return json(request, 400, { error: validationMessage(parsed.error) });
        const existing = findPostById(id);
        if (!existing) return json(request, 404, { error: 'Post not found' });
        const updated = await updatePost(id, {
          ...parsed.data,
          slug: parsed.data.slug ?? existing.slug,
          coverImageUrl: parsed.data.coverImageUrl ?? null,
          publishedAt: parsed.data.status === 'published' ? existing.publishedAt ?? new Date().toISOString() : null,
        });
        return json(request, 200, updated);
      }
      if (method === 'DELETE') {
        const deleted = await removePost(id);
        if (!deleted) return json(request, 404, { error: 'Post not found' });
        return json(request, 200, { success: true });
      }
    }
  }

  return json(request, 404, { error: 'Not found', path });
}
