import cors from 'cors';
import express, { Router } from 'express';
import { createRouter } from './routes';
import {
  createPost,
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

  ensureSchemaAndSeed();
  app.use('/api/blog', createBlogAliasRouter());
  app.use(
    '/api',
    createRouter({
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
    }),
  );

  return app;
}
