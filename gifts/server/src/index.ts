import { createServer } from 'node:http';
import { handleApi } from './httpApi';

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4001);

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || `127.0.0.1:${port}`;
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const url = new URL(req.url || '/', `${proto}://${host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value);
      else if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    }

    let body: Buffer | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      body = Buffer.concat(chunks);
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body: body && body.length > 0 ? body : undefined,
    });
    const response = await handleApi(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const bytes = Buffer.from(await response.arrayBuffer());
    res.end(bytes);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[gifts-api] listening on http://127.0.0.1:${port}`);
});
