import cors from 'cors';
import express, { Router } from 'express';
import { createRouter } from './routes';
import type { NextFunction, Request, Response } from 'express';
import {
  createPost,
  createUser,
  findPostById,
  findPublishedPostBySlug,
  findUserById,
  findUserByEmail,
  listAllPosts,
  listPublishedPosts,
  persistDatabase,
  prepareDatabase,
  removePost,
  updatePost,
  updateUserCredentials,
} from './db';

const allowedOrigins = [
  'https://mcwhorezone.com',
  'https://www.mcwhorezone.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function isAllowedBrowserOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function createBlogAliasRouter(): Router {
  const r = Router();
  r.get('/posts', (_req, res) => {
    res.json(listPublishedPosts());
  });
  r.get('/posts/:slug', (req, res) => {
    const post = findPublishedPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    return res.json(post);
  });
  return r;
}

export function createApp() {
  const app = express();
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (isAllowedBrowserOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  };
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));
  app.use(async (_req, _res, next) => {
    try {
      await prepareDatabase();
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use(persistWrites);
  const routeDeps = {
    listPublishedPosts,
    findPublishedPostBySlug,
    findPostById,
    createPost,
    updatePost,
    deletePost: removePost,
    listAllPosts,
    findUserByEmail,
    createUser,
    findUserById,
    updateUserCredentials,
  };
  // Vercel rewrites keep the /api prefix. The second mount covers runtimes that
  // present /posts instead of /api/posts. Each mount needs its own router.
  app.use('/api/blog', createBlogAliasRouter());
  app.use('/blog', createBlogAliasRouter());
  app.use('/api', createRouter(routeDeps));
  app.use('/', createRouter(routeDeps));

  return app;
}

function persistWrites(req: Request, res: Response, next: NextFunction): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    next();
    return;
  }
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  const end = res.end.bind(res) as (...parts: unknown[]) => Response;
  let ended = false;
  res.end = ((...args: unknown[]) => {
    if (ended) return res;
    ended = true;
    void persistDatabase()
      .catch((error) => {
        console.error('Failed to persist the blog database', error);
      })
      .finally(() => {
        end(...args);
      });
    return res;
  }) as Response['end'];
  next();
}
