import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import type { AuthProvider, BlogPost, PostStatus, User } from './types';

const dataDir = path.resolve(process.cwd(), 'server', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'app.db');

export const db = new Database(dbPath);

export function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      displayName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      authProvider TEXT NOT NULL DEFAULT 'local' CHECK(authProvider IN ('local', 'google', 'discord')),
      authSubject TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      coverImageUrl TEXT,
      status TEXT NOT NULL CHECK(status IN ('draft', 'published')),
      publishedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      authorId INTEGER NOT NULL,
      FOREIGN KEY(authorId) REFERENCES users(id)
    );
  `);
  migrateUsersV2();
}

function migrateUsersV2(): void {
  const readNames = () =>
    new Set(
      (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name),
    );
  let names = readNames();
  if (!names.has('authProvider')) {
    db.exec(`
      ALTER TABLE users ADD COLUMN authProvider TEXT NOT NULL DEFAULT 'local';
    `);
    names = readNames();
  }
  if (!names.has('authSubject')) {
    db.exec(`ALTER TABLE users ADD COLUMN authSubject TEXT;`);
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth_subject
    ON users(authProvider, authSubject)
    WHERE authSubject IS NOT NULL;
  `);
}

export function seedDatabase(): void {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync('change-me-admin', 10);
    db.prepare(
      `
      INSERT INTO users (email, displayName, passwordHash, role, authProvider, authSubject, createdAt, updatedAt)
      VALUES (@email, @displayName, @passwordHash, @role, 'local', NULL, @createdAt, @updatedAt)
    `,
    ).run({
      email: 'admin@example.com',
      displayName: 'Site Admin',
      passwordHash,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    });
  }

  const postCount = db.prepare('SELECT COUNT(*) AS count FROM posts').get() as { count: number };
  if (postCount.count === 0) {
    const author = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin') as
      | { id: number }
      | undefined;
    if (!author) return;
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO posts (slug, title, summary, content, coverImageUrl, status, publishedAt, createdAt, updatedAt, authorId)
      VALUES (@slug, @title, @summary, @content, @coverImageUrl, @status, @publishedAt, @createdAt, @updatedAt, @authorId)
    `,
    ).run({
      slug: 'welcome-to-my-new-site',
      title: 'Welcome to My New Personal Site',
      summary: 'A fresh start focused on projects, writing, and community updates.',
      content:
        'This is the first post on the rebuilt site. I will use this space for progress notes, personal updates, and curated resources.',
      coverImageUrl: null,
      status: 'published',
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
      authorId: author.id,
    });
  }
}

function mapPostRow(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    coverImageUrl: row.coverImageUrl ?? null,
    status: row.status as PostStatus,
    publishedAt: row.publishedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    authorId: row.authorId,
  };
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    passwordHash: row.passwordHash,
    role: row.role,
    authProvider: (row.authProvider ?? 'local') as AuthProvider,
    authSubject: row.authSubject ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const postRepo = {
  listPublished(): BlogPost[] {
    const rows = db
      .prepare(
        `
        SELECT * FROM posts
        WHERE status = 'published'
        ORDER BY datetime(COALESCE(publishedAt, createdAt)) DESC
      `,
      )
      .all();
    return rows.map(mapPostRow);
  },
  listAll(): BlogPost[] {
    const rows = db
      .prepare(
        `
        SELECT * FROM posts
        ORDER BY datetime(createdAt) DESC
      `,
      )
      .all();
    return rows.map(mapPostRow);
  },
  getBySlug(slug: string): BlogPost | null {
    const row = db.prepare('SELECT * FROM posts WHERE slug = ? LIMIT 1').get(slug);
    return row ? mapPostRow(row) : null;
  },
  getById(id: number): BlogPost | null {
    const row = db.prepare('SELECT * FROM posts WHERE id = ? LIMIT 1').get(id);
    return row ? mapPostRow(row) : null;
  },
  create(input: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): BlogPost {
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `
        INSERT INTO posts (slug, title, summary, content, coverImageUrl, status, publishedAt, createdAt, updatedAt, authorId)
        VALUES (@slug, @title, @summary, @content, @coverImageUrl, @status, @publishedAt, @createdAt, @updatedAt, @authorId)
      `,
      )
      .run({
        ...input,
        createdAt: now,
        updatedAt: now,
      });
    return this.getById(Number(result.lastInsertRowid)) as BlogPost;
  },
  update(
    id: number,
    updates: Partial<
      Pick<BlogPost, 'slug' | 'title' | 'summary' | 'content' | 'coverImageUrl' | 'status' | 'publishedAt'>
    >,
  ): BlogPost | null {
    const existing = this.getById(id);
    if (!existing) return null;
    const next = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.prepare(
      `
      UPDATE posts
      SET slug=@slug, title=@title, summary=@summary, content=@content,
          coverImageUrl=@coverImageUrl, status=@status, publishedAt=@publishedAt, updatedAt=@updatedAt
      WHERE id=@id
    `,
    ).run({
      id,
      slug: next.slug,
      title: next.title,
      summary: next.summary,
      content: next.content,
      coverImageUrl: next.coverImageUrl,
      status: next.status,
      publishedAt: next.publishedAt,
      updatedAt: next.updatedAt,
    });
    return this.getById(id);
  },
  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

export const userRepo = {
  findById(id: number): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').get(id);
    if (!row) return null;
    return mapUserRow(row);
  },
  findByEmail(email: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').get(email);
    if (!row) return null;
    return mapUserRow(row);
  },
  findByProviderSubject(provider: AuthProvider, subject: string): User | null {
    const row = db
      .prepare('SELECT * FROM users WHERE authProvider = ? AND authSubject = ? LIMIT 1')
      .get(provider, subject);
    if (!row) return null;
    return mapUserRow(row);
  },
  list(): User[] {
    const rows = db.prepare('SELECT * FROM users ORDER BY datetime(createdAt) DESC').all();
    return rows.map(mapUserRow);
  },
  async create(input: {
    email: string;
    displayName: string;
    role: 'admin' | 'user';
    password: string;
  }): Promise<User> {
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(input.password);
    const result = db
      .prepare(
        `
        INSERT INTO users (email, displayName, passwordHash, role, authProvider, authSubject, createdAt, updatedAt)
        VALUES (@email, @displayName, @passwordHash, @role, 'local', NULL, @createdAt, @updatedAt)
      `,
      )
      .run({
        email: input.email,
        displayName: input.displayName,
        passwordHash,
        role: input.role,
        createdAt: now,
        updatedAt: now,
      });
    return mapUserRow(
      db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)),
    );
  },
  updateCredentials(input: { id: number; email: string; passwordHash?: string }): User | null {
    const existing = this.findById(input.id);
    if (!existing) return null;
    const now = new Date().toISOString();
    db.prepare(
      `
        UPDATE users
        SET email = @email,
            passwordHash = COALESCE(@passwordHash, passwordHash),
            updatedAt = @updatedAt
        WHERE id = @id
      `,
    ).run({
      id: input.id,
      email: input.email,
      passwordHash: input.passwordHash ?? null,
      updatedAt: now,
    });
    const row = this.findById(input.id);
    return row;
  },
};

export function ensureSchemaAndSeed(): void {
  runMigrations();
  seedDatabase();
}

export function listPublishedPosts(): BlogPost[] {
  return postRepo.listPublished();
}

export function listAllPosts(): BlogPost[] {
  return postRepo.listAll();
}

export function findPublishedPostBySlug(slug: string): BlogPost | null {
  const post = postRepo.getBySlug(slug);
  if (!post || post.status !== 'published') {
    return null;
  }
  return post;
}

export function findPostById(id: number): BlogPost | null {
  return postRepo.getById(id);
}

export function createPost(input: {
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl?: string | null;
  status: BlogPostStatus;
  publishedAt?: string | null;
  authorId: number;
}): BlogPost {
  return postRepo.create({
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    content: input.content,
    coverImageUrl: input.coverImageUrl ?? null,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
    authorId: input.authorId,
  });
}

export function updatePost(
  id: number,
  input: {
    slug: string;
    title: string;
    summary: string;
    content: string;
    coverImageUrl?: string | null;
    status: BlogPostStatus;
    publishedAt?: string | null;
  },
): BlogPost | null {
  return postRepo.update(id, {
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    content: input.content,
    coverImageUrl: input.coverImageUrl ?? null,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
  });
}

export function removePost(id: number): boolean {
  return postRepo.delete(id);
}

export function findUserByEmail(email: string): User | null {
  return userRepo.findByEmail(email);
}

export function findUserById(id: number): User | null {
  return userRepo.findById(id);
}

export function findUserByProviderSubject(provider: AuthProvider, subject: string): User | null {
  return userRepo.findByProviderSubject(provider, subject);
}

export async function createUser(input: {
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  password: string;
}): Promise<User> {
  return userRepo.create(input);
}

export async function createOAuthUser(input: {
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  provider: AuthProvider;
  subject: string;
}): Promise<User> {
  const now = new Date().toISOString();
  const randomSecret = crypto.randomBytes(32).toString('base64url');
  const passwordHash = await hashPassword(`oauth:${input.provider}:${randomSecret}`);
  const result = db
    .prepare(
      `
      INSERT INTO users (email, displayName, passwordHash, role, authProvider, authSubject, createdAt, updatedAt)
      VALUES (@email, @displayName, @passwordHash, @role, @authProvider, @authSubject, @createdAt, @updatedAt)
    `,
    )
    .run({
      email: input.email,
      displayName: input.displayName,
      passwordHash,
      role: input.role,
      authProvider: input.provider,
      authSubject: input.subject,
      createdAt: now,
      updatedAt: now,
    });
  return mapUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)));
}

export async function updateUserCredentials(input: {
  id: number;
  email: string;
  password?: string;
}): Promise<User | null> {
  const passwordHash = input.password ? await hashPassword(input.password) : undefined;
  return userRepo.updateCredentials({
    id: input.id,
    email: input.email,
    passwordHash,
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
