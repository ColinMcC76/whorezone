import { Express, Router } from 'express';
import { z } from 'zod';
import { BlogPost, PostStatus, User } from './types';
import { generateToken, requireAdmin, requireAuth, AuthRequest } from './auth';
import {
  createUser,
  ensureSchemaAndSeed,
  findPostById,
  findPublishedPostBySlug,
  findUserById,
  findUserByEmail,
  listAllPosts,
  listPublishedPosts,
  removePost,
  updatePost,
  updateUserCredentials,
  upsertPost,
  verifyPassword,
} from './db';

interface RouteDeps {
  listPublishedPosts: () => BlogPost[];
  findPublishedPostBySlug: (slug: string) => BlogPost | null;
  findPostById: (id: number) => BlogPost | null;
  createPost: (input: {
    slug: string;
    title: string;
    summary: string;
    content: string;
    coverImageUrl?: string | null;
    status: PostStatus;
    publishedAt?: string | null;
    authorId: number;
  }) => BlogPost;
  updatePost: (
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
  ) => BlogPost | null;
  deletePost: (id: number) => boolean;
  listAllPosts: () => BlogPost[];
  findUserByEmail: (email: string) => User | null;
  createUser: (input: {
    email: string;
    displayName: string;
    role: 'admin' | 'user';
    password: string;
  }) => User;
  findUserById: (id: number) => User | null;
  updateUserCredentials: (input: { id: number; email: string; password?: string }) => User | null;
}

const postPayloadSchema = z.object({
  slug: z.string().min(2).max(120).optional(),
  title: z.string().min(2).max(180),
  summary: z.string().min(10).max(500),
  content: z.string().min(10),
  coverImageUrl: z.string().url().optional().nullable(),
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

function toSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `post-${Date.now()}`;
}

export function createRouter(deps: RouteDeps): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.post('/auth/register', async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const existing = deps.findUserByEmail(parsed.data.email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = deps.createUser({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      role: deps.findUserByEmail('admin@personalhub.dev') ? 'user' : 'admin',
      password: parsed.data.password,
    });

    const token = generateToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  });

  router.post('/auth/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const user = deps.findUserByEmail(parsed.data.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  });

  router.patch('/auth/me', requireAuth, (req: AuthRequest, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const current = deps.findUserById(req.user!.id);
    if (!current) {
      return res.status(404).json({ error: 'User not found' });
    }
    const emailInUse = deps.findUserByEmail(parsed.data.email);
    if (emailInUse && emailInUse.id !== req.user!.id) {
      return res.status(409).json({ error: 'Email is already in use' });
    }
    const updated = deps.updateUserCredentials({
      id: req.user!.id,
      email: parsed.data.email,
      password: parsed.data.newPassword || undefined,
    });
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
    const token = generateToken(updated);
    return res.json({
      token,
      user: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
      },
    });
  });

  router.get('/posts', (_req, res) => {
    res.json(deps.listPublishedPosts());
  });

  router.get('/posts/:slug', (req, res) => {
    const post = deps.findPublishedPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    return res.json(post);
  });

  router.get('/admin/posts', requireAdmin, (_req: AuthRequest, res) => {
    res.json(deps.listAllPosts());
  });

  router.post('/admin/posts', requireAdmin, (req: AuthRequest, res) => {
    const parsed = postPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const publishedAt = parsed.data.status === 'published' ? new Date().toISOString() : null;
    const created = deps.createPost({
      ...parsed.data,
      slug: parsed.data.slug ?? toSlug(parsed.data.title),
      publishedAt,
      authorId: req.user!.id,
    });
    return res.status(201).json(created);
  });

  router.put('/admin/posts/:id', requireAdmin, (req, res) => {
    const parsed = postPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const existing = deps.findPostById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const publishedAt =
      parsed.data.status === 'published'
        ? existing.publishedAt ?? new Date().toISOString()
        : null;

    const updated = deps.updatePost(id, {
      ...parsed.data,
      slug: parsed.data.slug ?? existing.slug,
      publishedAt,
    });
    return res.json(updated);
  });

  router.delete('/admin/posts/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const deleted = deps.deletePost(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }
    return res.status(204).send();
  });

  router.patch('/admin/posts/:id/status', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const statusParsed = z
      .object({
        status: z.enum(['draft', 'published']),
      })
      .safeParse(req.body);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    if (!statusParsed.success) {
      return res.status(400).json({ error: statusParsed.error.flatten() });
    }

    const existing = deps.findPostById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updated = deps.updatePost(id, {
      slug: existing.slug,
      title: existing.title,
      summary: existing.summary,
      content: existing.content,
      coverImageUrl: existing.coverImageUrl,
      status: statusParsed.data.status,
      publishedAt:
        statusParsed.data.status === 'published'
          ? existing.publishedAt ?? new Date().toISOString()
          : null,
    });

    return res.json(updated);
  });

  return router;
}

export function registerRoutes(app: Express): void {
  ensureSchemaAndSeed();
  const router = createRouter({
    listPublishedPosts,
    findPublishedPostBySlug,
    findPostById,
    createPost: upsertPost,
    updatePost,
    deletePost: removePost,
    listAllPosts,
    findUserByEmail,
    createUser,
    findUserById,
    updateUserCredentials,
  });
  app.use('/api', router);
}
