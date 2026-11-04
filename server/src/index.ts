import http from 'node:http';
import { handleApi } from './httpApi';

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? `127.0.0.1:${port}`;
    const url = new URL(req.url ?? '/', `http://${host}`);
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const body = Buffer.concat(chunks);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value);
      else if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    }
    const request = new Request(url, {
      method: req.method,
      headers,
      body: body.length > 0 && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
    });
    const response = await handleApi(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'API failed' }));
  }
});

server.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
