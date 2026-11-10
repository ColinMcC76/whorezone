import type { AuthProvider, BlogPost, PostStatus, User } from './types';
import { ADMIN_PASSWORD, ADMIN_SALT, SEED_ADMIN, SEED_POSTS } from './catalog';

const BLOB_PATH = 'mcwhorezone/blog.json';

let users: User[] = [];
let posts: BlogPost[] = [];
let nextUserId = 2;
let nextPostId = 7;
let ready: Promise<void> | null = null;

function syncSeedPosts(): boolean {
  let changed = false;
  for (const seed of SEED_POSTS) {
    const existing = posts.find((post) => post.slug === seed.slug);
    if (!existing) {
      posts.push({ ...seed, id: nextPostId });
      nextPostId += 1;
      changed = true;
      continue;
    }
    if (
      existing.title !== seed.title ||
      existing.summary !== seed.summary ||
      existing.content !== seed.content ||
      existing.status !== seed.status ||
      existing.publishedAt !== seed.publishedAt
    ) {
      existing.title = seed.title;
      existing.summary = seed.summary;
      existing.content = seed.content;
      existing.status = seed.status;
      existing.publishedAt = seed.publishedAt;
      existing.updatedAt = seed.updatedAt;
      existing.coverImageUrl = seed.coverImageUrl;
      changed = true;
    }
  }
  if (changed) reindex();
  return changed;
}

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

function clonePosts(source: BlogPost[]): BlogPost[] {
  return source.map((post) => ({ ...post }));
}

function publishedCount(source: BlogPost[]): number {
  return source.filter((post) => post.status === 'published').length;
}

function reindex(): void {
  nextUserId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
  nextPostId = posts.reduce((max, post) => Math.max(max, post.id), 0) + 1;
}

async function seed(): Promise<void> {
  const admin: User = {
    ...SEED_ADMIN,
    passwordHash: await hashPassword(ADMIN_PASSWORD, ADMIN_SALT),
  };
  users = [admin];
  posts = clonePosts(SEED_POSTS);
  reindex();
}

async function restoreFromBlob(): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;
  const { get } = await import('@vercel/blob');
  const result = await get(BLOB_PATH, { access: 'private', token, useCache: false });
  if (!result?.stream) return;
  const parsed = JSON.parse(await new Response(result.stream).text()) as {
    users?: User[];
    posts?: BlogPost[];
  };
  if (!Array.isArray(parsed.posts) || publishedCount(parsed.posts) === 0) return;
  posts = clonePosts(parsed.posts);
  if (Array.isArray(parsed.users) && parsed.users.length > 0) {
    users = parsed.users.map((user) => ({ ...user }));
  }
  reindex();
  if (syncSeedPosts()) {
    await persistStore();
  }
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

export function readyStore(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await seed();
      try {
        await withTimeout(restoreFromBlob(), 1200);
      } catch (error) {
        console.error('Blog database restore skipped', error);
      }
    })();
  }
  return ready;
}

export async function persistStore(): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;
  try {
    const { put } = await import('@vercel/blob');
    await withTimeout(
      put(BLOB_PATH, JSON.stringify({ users, posts }), {
        access: 'private',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      }),
      4000,
    );
  } catch (error) {
    console.error('Blog database save skipped', error);
  }
}

export function listPublishedPosts(): BlogPost[] {
  return posts
    .filter((post) => post.status === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function findPublishedPostBySlug(slug: string): BlogPost | null {
  return posts.find((post) => post.status === 'published' && post.slug === slug) ?? null;
}

export function listAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findPostById(id: number): BlogPost | null {
  return posts.find((post) => post.id === id) ?? null;
}

export function findUserById(id: number): User | null {
  return users.find((user) => user.id === id) ?? null;
}

export function findUserByEmail(email: string): User | null {
  const needle = email.toLowerCase();
  return users.find((user) => user.email.toLowerCase() === needle) ?? null;
}

export function findUserByProviderSubject(provider: AuthProvider, subject: string): User | null {
  return users.find((user) => user.authProvider === provider && user.authSubject === subject) ?? null;
}

export async function createUser(input: {
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  password: string;
}): Promise<User> {
  const now = new Date().toISOString();
  const user: User = {
    id: nextUserId,
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    passwordHash: await hashPassword(input.password, `user-${nextUserId}-${now}`),
    role: input.role,
    authProvider: 'local',
    authSubject: null,
    createdAt: now,
    updatedAt: now,
  };
  nextUserId += 1;
  users.push(user);
  await persistStore();
  return user;
}

export async function createOAuthUser(input: {
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  provider: AuthProvider;
  subject: string;
}): Promise<User> {
  const existing = findUserByProviderSubject(input.provider, input.subject);
  if (existing) return existing;
  const now = new Date().toISOString();
  const user: User = {
    id: nextUserId,
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    passwordHash: `oauth$${input.provider}$${crypto.randomUUID()}`,
    role: input.role,
    authProvider: input.provider,
    authSubject: input.subject,
    createdAt: now,
    updatedAt: now,
  };
  nextUserId += 1;
  users.push(user);
  await persistStore();
  return user;
}

export async function updateUserCredentials(input: {
  id: number;
  email: string;
  password?: string;
}): Promise<User | null> {
  const user = findUserById(input.id);
  if (!user) return null;
  user.email = input.email.toLowerCase();
  if (input.password) {
    user.passwordHash = await hashPassword(input.password, `user-${user.id}-${Date.now()}`);
  }
  user.updatedAt = new Date().toISOString();
  await persistStore();
  return user;
}

export async function createPost(input: {
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl?: string | null;
  status: PostStatus;
  publishedAt?: string | null;
  authorId: number;
}): Promise<BlogPost> {
  const now = new Date().toISOString();
  const post: BlogPost = {
    id: nextPostId,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    content: input.content,
    coverImageUrl: input.coverImageUrl ?? null,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
    createdAt: now,
    updatedAt: now,
    authorId: input.authorId,
  };
  nextPostId += 1;
  posts.push(post);
  await persistStore();
  return post;
}

export async function updatePost(
  id: number,
  input: {
    slug: string;
    title: string;
    summary: string;
    content: string;
    coverImageUrl?: string | null;
    status: PostStatus;
    publishedAt?: string | null;
  },
): Promise<BlogPost | null> {
  const post = findPostById(id);
  if (!post) return null;
  post.slug = input.slug;
  post.title = input.title;
  post.summary = input.summary;
  post.content = input.content;
  post.coverImageUrl = input.coverImageUrl ?? null;
  post.status = input.status;
  post.publishedAt = input.publishedAt ?? null;
  post.updatedAt = new Date().toISOString();
  await persistStore();
  return post;
}

export async function removePost(id: number): Promise<boolean> {
  const before = posts.length;
  posts = posts.filter((post) => post.id !== id);
  if (posts.length === before) return false;
  if (publishedCount(posts) === 0) {
    for (const seed of SEED_POSTS) {
      if (seed.status === 'published' && !posts.some((post) => post.slug === seed.slug)) {
        posts.push({ ...seed });
      }
    }
    reindex();
  }
  await persistStore();
  return true;
}
