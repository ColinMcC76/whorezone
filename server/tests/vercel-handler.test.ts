import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { afterAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const handler = require('../../api/[...path].js') as (req: http.IncomingMessage, res: http.ServerResponse) => void;

const server = http.createServer((req, res) => {
  void handler(req, res);
});

await new Promise<void>((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve());
});

const port = (server.address() as AddressInfo).port;

afterAll(async () => {
  server.close();
  await once(server, 'close');
});

describe('Vercel Node handler', () => {
  it('answers public health and posts without a login', async () => {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });

    const posts = await fetch(`http://127.0.0.1:${port}/api/posts`);
    expect(posts.status).toBe(200);
    const body = (await posts.json()) as Array<{ slug: string; status: string }>;
    expect(body.length).toBeGreaterThan(1);
    expect(body[0]?.slug).toBe('welcome-to-my-new-site');
    expect(body.every((post) => post.status === 'published')).toBe(true);

    const draft = await fetch(`http://127.0.0.1:${port}/api/posts/private-draft`);
    expect(draft.status).toBe(404);
  });
});
