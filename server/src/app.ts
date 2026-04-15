import cors from 'cors';
import express from 'express';
import { createRouter } from './routes';
import {
  createPost,
  createUser,
  ensureSchemaAndSeed,
  findPostById,
  findPublishedPostBySlug,
  findUserByEmail,
  listAllPosts,
  listPublishedPosts,
  removePost,
  updatePost,
} from './db';

export function createApp() {
  const app = express();
  const allowedOrigins = ['https://mcwhorezone.com', 'http://localhost:5173'];
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));

  ensureSchemaAndSeed();
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
    }),
  );

  return app;
}
