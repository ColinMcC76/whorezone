# Personal Hub Website

This repository contains a personal website rebuilt as a creative hub with:

- Home, Blog, Projects, Resume, and Contact pages
- Public sign up / sign in (email + password) plus optional Google and Discord OAuth
- A login-protected admin blog dashboard (admin role only)
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

- `POST /auth/register` — creates a normal `user` account (password stored as a bcrypt hash only)
- `POST /auth/login`
- `GET /auth/me` — current user (Bearer token)
- `PATCH /auth/me` — update email/password for **local** accounts only
- `GET /auth/oauth/google/start` — redirects to Google (requires env vars below)
- `GET /auth/oauth/discord/start` — redirects to Discord
- `GET /auth/oauth/callback` — OAuth redirect URI (configure in Google/Discord consoles)
- `POST /auth/oauth/consume` — exchange one-time ticket for JWT (used by the SPA after OAuth)

Passwords are never stored in plain text: only bcrypt hashes live in SQLite. OAuth users get a random internal password hash so the account cannot be logged in with a guessed password.

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
- `PORT` (preferred in hosted platforms like Render)

### OAuth (Google + Discord)

Set these on the **API** host (e.g. Render). If they are missing, the OAuth start URLs return `503` with a clear error.

**Shared**

- `JWT_SECRET` — signing secret for JWTs and OAuth `state` tokens (use a long random string in production)
- `FRONTEND_OAUTH_REDIRECT_URL` — **required in production**: where the API redirects the browser after Google/Discord (success or error). Use your real site, e.g. `https://mcwhorezone.com/#/auth/callback` (include the `#/auth/callback` path for this app). If this is unset on Render, users are sent to `http://localhost:5173/#/auth/callback` by mistake.

**Google**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` — must match the Google Cloud console, e.g. `https://your-api.onrender.com/api/auth/oauth/callback`

**Discord**

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI` — same pattern as Google (`.../api/auth/oauth/callback`)

In Discord Developer Portal, add the same redirect URL under OAuth2 → Redirects. Enable the `email` and `identify` scopes (the app requests both).

## Render deployment (API)

If your Render deploys are timing out, ensure the service starts the API process (not watch/dev mode):

- Build Command: `npm install`
- Start Command: `npm run start:api`

The server binds to `PORT` automatically (`PORT || API_PORT || 4000`).

This repository also includes `render.yaml` with the same defaults.

## GitHub Pages Notes

If you host this repository on GitHub Pages:

- Use the built frontend output (`dist`), not raw source files from the repo root.
- For this project, the simple path is using `npm run deploy` to publish `dist` to the `gh-pages` branch.
- In repository settings, point Pages to the `gh-pages` branch.

This app now uses `HashRouter`, so direct refreshes on sub-pages work on static hosts like GitHub Pages.

Important: GitHub Pages only hosts static files. The Express API in `server/` is not deployed there.  
To use live blog CRUD/auth in production, deploy the API separately and set `VITE_API_URL` to that backend URL.