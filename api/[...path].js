const fallbackPosts = [
  {
    id: 1,
    slug: 'welcome-to-my-new-site',
    title: 'Welcome to My New Personal Site',
    summary: 'A fresh start for projects, notes, and the occasional longer write-up.',
    content:
      'This is the first post on the rebuilt site. The blog is public, so you can read it without signing in.\nI will use this space for progress notes, things I am building, and the occasional write-up that does not fit anywhere else.\nDrafts stay in the admin dashboard. Only published posts show up here.',
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
    content:
      'The home page is the front door. Projects, resume, and the blog are the parts I expect to keep current.\nPosts are served by the API on this same domain. If you can open the site, you can open the blog.\nAccounts are only for writing. Reading does not require one.',
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
    content:
      'The site and the blog now live in one Vercel deployment, so there is no separate API host to keep awake.\nSample posts ship with the app. New posts can be saved from the admin page once you are signed in.\nIf a write does not stick across a restart, connect a Vercel Blob store. The sample posts still load either way.',
    coverImageUrl: null,
    status: 'published',
    publishedAt: '2026-10-02T15:00:00.000Z',
    createdAt: '2026-10-02T15:00:00.000Z',
    updatedAt: '2026-10-02T15:00:00.000Z',
    authorId: 1,
  },
];

function firstQuery(value) {
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : '';
}

function applyIncomingPath(req) {
  const url = new URL(req.url || '/', 'https://mcwhorezone.local');
  const queryPath = firstQuery(req.query && req.query.path) || url.searchParams.get('path') || '';
  const slug = firstQuery(req.query && req.query.slug) || url.searchParams.get('slug') || '';
  if (queryPath) {
    const cleaned = String(queryPath).replace(/^\/+/, '').replace(/^api\//, '');
    req.url = `/api/${cleaned}`;
    return;
  }
  const path = requestPath(req.url);
  if (slug && path !== `/posts/${slug}`) {
    req.url = `/api/posts/${encodeURIComponent(slug)}`;
  }
}

function requestPath(url) {
  const pathname = String(url || '/').split('?')[0];
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (trimmed === '/api') return '/';
  if (trimmed.startsWith('/api/')) return trimmed.slice(4);
  return trimmed;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(payload);
}

function sendFallback(req, res) {
  const path = requestPath(req.url);
  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { ok: true });
    return true;
  }
  if (req.method === 'GET' && (path === '/posts' || path === '/blog/posts')) {
    sendJson(res, 200, fallbackPosts);
    return true;
  }
  const match = path.match(/^\/(?:blog\/)?posts\/([^/]+)$/);
  if (req.method === 'GET' && match) {
    const post = fallbackPosts.find((item) => item.slug === decodeURIComponent(match[1]));
    if (!post) sendJson(res, 404, { error: 'Post not found' });
    else sendJson(res, 200, post);
    return true;
  }
  return false;
}

function isPublicRead(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const path = requestPath(req.url);
  return path === '/health' || path === '/posts' || path === '/blog/posts' || /^\/(?:blog\/)?posts\/[^/]+$/.test(path);
}

function toRequest(req) {
  const host = req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(req.url || '/', `${proto}://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
  }
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return Promise.resolve(new Request(url, { method: req.method, headers }));
  }
  const chunks = [];
  return new Promise((resolve, reject) => {
    const finish = () => {
      const body = Buffer.concat(chunks);
      resolve(new Request(url, { method: req.method, headers, body: body.length > 0 ? body : undefined }));
    };
    if (req.readableEnded || req.complete) {
      finish();
      return;
    }
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', finish);
    req.on('error', reject);
    if (typeof req.resume === 'function') req.resume();
  });
}

function loadHandleApi() {
  const loaded = require('../server/handler.cjs');
  const handleApi = loaded.handleApi || loaded.default?.handleApi;
  if (typeof handleApi !== 'function') {
    throw new Error('API bundle did not export handleApi');
  }
  return handleApi;
}

function writeResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  return response.arrayBuffer().then((bytes) => {
    res.end(Buffer.from(bytes));
  });
}

async function handler(req, res) {
  applyIncomingPath(req);
  const publicRead = isPublicRead(req);
  let timedOut = false;
  const timeout = publicRead
    ? setTimeout(() => {
        timedOut = true;
        if (!res.headersSent) sendFallback(req, res);
      }, 2000)
    : null;
  try {
    const handleApi = loadHandleApi();
    const request = await toRequest(req);
    const response = await handleApi(request);
    if (timeout) clearTimeout(timeout);
    if (timedOut || res.headersSent) return;
    await writeResponse(res, response);
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    console.error(error);
    if (res.headersSent) return;
    if (sendFallback(req, res)) return;
    const message = error instanceof Error ? error.message : 'API failed';
    const stack = error instanceof Error ? error.stack : undefined;
    sendJson(res, 500, { error: message, stack });
  }
}

module.exports = handler;
