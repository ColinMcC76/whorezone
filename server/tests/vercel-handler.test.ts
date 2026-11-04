import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { afterAll, describe, expect, it } from 'vitest';
import handler from '../../api/index';

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
  it('is a function the Node runtime can call', () => {
    expect(typeof handler).toBe('function');
  });

  it('answers /api/health and /api/posts', async () => {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });

    const posts = await fetch(`http://127.0.0.1:${port}/api/posts`);
    expect(posts.status).toBe(200);
    const body = (await posts.json()) as Array<{ slug: string }>;
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]?.slug).toBe('welcome-to-my-new-site');
  });
});
