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
  {
    id: 5,
    slug: 'watching-the-same-frame',
    title: 'Watching the same frame, without waking the whole server',
    summary:
      'GrokSlop’s panel at whorezone.party gets a shared Stream tab, quieter equipment-check sound-off, and a launcher that brings the Cloudflare tunnel up with the bot.',
    content:
      "GrokSlop's control panel already had Controls, a YouTube queue, and a soundboard. This round adds a shared Stream tab, a quieter equipment-check sound-off, and a launcher that brings the Cloudflare tunnel up with the bot. The live interface is at whorezone.party.\nOne picture for everyone on the server\nThe new Stream tab plays YouTube in the panel. Audio stays in the browser. Nothing is sent into the Discord voice channel.\nEveryone who opens Stream for the same server is on the same video. Play, pause, seek, skip, volume, and the queue are shared. The panel keeps one clock, and each browser follows it, so people stay on the same moment instead of drifting off into their own copies. Add a link, a playlist, or a search, then reorder or remove what is coming up.\nThe page scrolls, so the queue is reachable on a normal 1080p screen. The player has theater and full screen. Under the controls, a Watching list shows who has clicked in to watch. Your own name is marked, and someone drops off the list when they leave the page or switch servers.\nSound-off stays in the voice channel\nEquipment check sound-off no longer pings roles or @everyone. It writes the check, speaks it in the voice channel, and posts that same text in the voice channel's own chat. Mentions in the transcript are suppressed.\nThe panel button no longer asks you to pick a text channel. If GrokSlop is already in a voice channel, the transcript goes there. If it is not, the panel can join the voice channel you already had selected, then post and speak there. The slash command works the same way: join a voice channel, then run /equipmentchecksoundoff. An optional prompt still steers the wording.\nThe tunnel starts with the bot\nStart-GrokSlop.bat now starts the bot and cloudflared tunnel run grokslop in separate minimized windows. Close the bot window to stop GrokSlop. Close the tunnel window to stop the tunnel. If cloudflared is missing, or there is no config at %USERPROFILE%\\.cloudflared\\config.yml, the bot still starts and the script tells you why the tunnel did not.",
    coverImageUrl: null,
    status: 'published',
    publishedAt: '2026-11-09T15:00:00.000Z',
    createdAt: '2026-11-09T15:00:00.000Z',
    updatedAt: '2026-11-09T16:00:00.000Z',
    authorId: 1,
  },
  {
    id: 6,
    slug: 'server-back-up-on-26-3',
    title: 'The server is back up on 26.3',
    summary:
      'The world is online again on Minecraft 26.3. Java joins at play.mcwhorezone.com; Bedrock joins at br.mcwhorezone.com. The machine sleeps when empty and wakes on a Java join.',
    content:
      'The world is online again, now running Minecraft 26.3.\nJava: play.mcwhorezone.com\nBedrock: br.mcwhorezone.com\nAdd it in the server list and join. Your old world is the same one.\nIt sleeps when nobody is playing\nThe machine no longer leaves the world running all day. When the server list says it is sleeping, a Java player joining play.mcwhorezone.com is what starts it.\nThe first person in may sit on “Connecting” for a few seconds while the world boots. If it kicks you and says to rejoin in a minute, connect again. Everyone after that joins normally.\nAfter the last player leaves, the world stays up for 10 minutes, saves, and shuts down. The next Java join starts it again.\nBedrock\nbr.mcwhorezone.com works while the world is already running. A Bedrock join cannot wake a sleeping server. If the Java listing says the server is sleeping, someone needs to join from Java first. Once it is up, Bedrock can connect as usual.',
    coverImageUrl: null,
    status: 'published',
    publishedAt: '2026-11-09T18:00:00.000Z',
    createdAt: '2026-11-09T18:00:00.000Z',
    updatedAt: '2026-11-09T18:00:00.000Z',
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

function serializeNodeBody(body) {
  if (body == null) return undefined;
  if (Buffer.isBuffer(body)) return body.length > 0 ? body : undefined;
  if (typeof body === 'string') return body.length > 0 ? Buffer.from(body) : undefined;
  if (typeof body === 'object') return Buffer.from(JSON.stringify(body));
  return Buffer.from(String(body));
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

  // Vercel Node functions often pre-parse JSON into req.body and end the stream,
  // so reading only the raw stream yields an empty payload.
  const parsedBody = serializeNodeBody(req.body);
  if (parsedBody) {
    return Promise.resolve(new Request(url, { method: req.method, headers, body: parsedBody }));
  }

  const chunks = [];
  return new Promise((resolve, reject) => {
    const finish = () => {
      const streamed = Buffer.concat(chunks);
      const body = streamed.length > 0 ? streamed : serializeNodeBody(req.body);
      resolve(new Request(url, { method: req.method, headers, body: body && body.length > 0 ? body : undefined }));
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
