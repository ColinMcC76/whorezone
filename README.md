# Personal Hub Website

This repository contains a personal website rebuilt as a creative hub with:

- Home, Blog, Projects, Resume, and Contact pages
- A login-protected admin blog dashboard
- Full blog CRUD API backed by SQLite
- JWT auth and role-based admin checks

The app is a Vite + React frontend with an Express API in `server/`.

## Tech Stack

- Frontend: React, React Router, TypeScript, Vite
- Backend: Express, TypeScript
- Data: SQLite (`better-sqlite3`)
- Auth: JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)
- Validation: Zod
- Tests: Vitest + Supertest

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start frontend and backend together:

   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - API: `http://localhost:4000`

3. Build production frontend:

   ```bash
   npm run build
   ```

4. Run tests:

   ```bash
   npm test
   ```

## API Overview

Base URL: `http://localhost:4000/api`

Public endpoints:

- `GET /health`
- `GET /posts`
- `GET /posts/:slug`

Auth endpoints:

- `POST /auth/register`
- `POST /auth/login`

Admin endpoints (Bearer token, admin role required):

- `GET /admin/posts`
- `POST /admin/posts`
- `PUT /admin/posts/:id`
- `DELETE /admin/posts/:id`
- `PATCH /admin/posts/:id/status`

## Seed Data

On first run, the backend creates:

- an admin user: `admin@example.com` / `change-me-admin`
- one published sample post

Update these credentials before deploying publicly.

## Configuration

Frontend branding and external links are configured in:

- `src/config/siteConfig.ts`

API URL can be overridden with:

- `VITE_API_URL`

Server port can be overridden with:

- `API_PORT` (default `4000`)

## GitHub Pages Notes

If you host this repository on GitHub Pages:

- Use the built frontend output (`dist`), not raw source files from the repo root.
- For this project, the simple path is using `npm run deploy` to publish `dist` to the `gh-pages` branch.
- In repository settings, point Pages to the `gh-pages` branch.

This app now uses `HashRouter`, so direct refreshes on sub-pages work on static hosts like GitHub Pages.

Important: GitHub Pages only hosts static files. The Express API in `server/` is not deployed there.  
To use live blog CRUD/auth in production, deploy the API separately and set `VITE_API_URL` to that backend URL.