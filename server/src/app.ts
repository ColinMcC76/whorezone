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
  app.use(cors());
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
