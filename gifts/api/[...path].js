function firstQuery(value) {
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : '';
}

function requestPath(url) {
  const pathname = String(url || '/').split('?')[0];
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (trimmed === '/api') return '/';
  if (trimmed.startsWith('/api/')) return trimmed.slice(4);
  return trimmed;
}

function applyIncomingPath(req) {
  const url = new URL(req.url || '/', 'https://gifts.mcwhorezone.local');
  const queryPath = firstQuery(req.query && req.query.path) || url.searchParams.get('path') || '';
  if (queryPath) {
    const cleaned = String(queryPath).replace(/^\/+/, '').replace(/^api\//, '');
    req.url = `/api/${cleaned}`;
  }
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
  try {
    const handleApi = loadHandleApi();
    const request = await toRequest(req);
    const response = await handleApi(request);
    if (res.headersSent) return;
    await writeResponse(res, response);
  } catch (error) {
    console.error(error);
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'API failed' }));
  }
}

module.exports = handler;
