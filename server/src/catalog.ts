import type { BlogPost, User } from './types';

const now = '2026-11-01T15:00:00.000Z';

export const SEED_ADMIN: User = {
  id: 1,
  email: 'admin@example.com',
  displayName: 'Site Admin',
  passwordHash: '',
  role: 'admin',
  authProvider: 'local',
  authSubject: null,
  createdAt: now,
  updatedAt: now,
};

export const ADMIN_PASSWORD = 'change-me-admin';
export const ADMIN_SALT = 'mcwhorezone-seed-v1';

export const SEED_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'welcome-to-my-new-site',
    title: 'Welcome to My New Personal Site',
    summary: 'A fresh start for projects, notes, and the occasional longer write-up.',
    content: [
      'This is the first post on the rebuilt site. The blog is public, so you can read it without signing in.',
      'I will use this space for progress notes, things I am building, and the occasional write-up that does not fit anywhere else.',
      'Drafts stay in the admin dashboard. Only published posts show up here.',
    ].join('\n'),
    coverImageUrl: null,
    status: 'published',
    publishedAt: '2026-11-01T15:00:00.000Z',
    createdAt: '2026-11-01T15:00:00.000Z',
    updatedAt: '2026-11-01T15:00:00.000Z',
    authorId: 1,
  },
  {
    id: 2,
    slug: 'what-this-site-is-for',
    title: 'What This Site Is For',
    summary: 'A short map of the pages on the site and what I plan to keep updated.',
    content: [
      'The home page is the front door. Projects, resume, and the blog are the parts I expect to keep current.',
      'Posts are served by the API on this same domain. If you can open the site, you can open the blog.',
      'Accounts are only for writing. Reading does not require one.',
    ].join('\n'),
    coverImageUrl: null,
    status: 'published',
    publishedAt: '2026-10-18T15:00:00.000Z',
    createdAt: '2026-10-18T15:00:00.000Z',
    updatedAt: '2026-10-18T15:00:00.000Z',
    authorId: 1,
  },
  {
    id: 3,
    slug: 'notes-from-the-workbench',
    title: 'Notes From the Workbench',
    summary: 'A few things I have been turning over while putting the site back together.',
    content: [
      'The site and the blog now live in one Vercel deployment, so there is no separate API host to keep awake.',
      'Sample posts ship with the app. New posts can be saved from the admin page once you are signed in.',
      'If a write does not stick across a restart, connect a Vercel Blob store. The sample posts still load either way.',
    ].join('\n'),
    coverImageUrl: null,
    status: 'published',
    publishedAt: '2026-10-02T15:00:00.000Z',
    createdAt: '2026-10-02T15:00:00.000Z',
    updatedAt: '2026-10-02T15:00:00.000Z',
    authorId: 1,
  },
  {
    id: 4,
    slug: 'private-draft',
    title: 'Private Draft',
    summary: 'This draft is only visible in the admin dashboard.',
    content: 'Unpublished notes stay off the public blog until they are explicitly published.',
    coverImageUrl: null,
    status: 'draft',
    publishedAt: null,
    createdAt: '2026-09-15T15:00:00.000Z',
    updatedAt: '2026-09-15T15:00:00.000Z',
    authorId: 1,
  },
];
