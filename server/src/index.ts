import cors from 'cors';
import express from 'express';
import { createRouter } from './routes';
import {
  createUser,
  deletePost,
  ensureSchemaAndSeed,
  findPostById,
  findPublishedPostBySlug,
  findUserByEmail,
  listAllPosts,
  listPublishedPosts,
  updatePost,
  createPost,
} from './db';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

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
    deletePost,
    listAllPosts,
    findUserByEmail,
    createUser,
  }),
);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
});
