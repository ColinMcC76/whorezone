import http from 'node:http';
import { EventEmitter } from 'node:events';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { afterAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const handler = require('../../api/[...path].js') as (req: http.IncomingMessage, res: http.ServerResponse) => void;
const inquiryHandler = require('../../api/services/inquiry.js') as (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => void;

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

    const post = await fetch(`http://127.0.0.1:${port}/api/posts/notes-from-the-workbench`);
    expect(post.status).toBe(200);
    const detail = (await post.json()) as { slug: string; title: string };
    expect(detail.slug).toBe('notes-from-the-workbench');
    expect(detail.title).toBe('Notes From the Workbench');

    const bySlugParam = await fetch(`http://127.0.0.1:${port}/?slug=notes-from-the-workbench`);
    expect(bySlugParam.status).toBe(200);
    expect(((await bySlugParam.json()) as { slug: string }).slug).toBe('notes-from-the-workbench');
  });

  it('reads JSON from req.body when Vercel has already parsed the stream', async () => {
    const req = new EventEmitter() as EventEmitter & {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: Record<string, string>;
      readableEnded: boolean;
      complete: boolean;
    };
    req.method = 'POST';
    req.url = '/api/foo';
    req.headers = {
      host: '127.0.0.1',
      'content-type': 'application/json',
      origin: 'https://www.mcwhorezone.com',
    };
    req.body = {
      name: 'Alex Client',
      email: 'alex@example.com',
      serviceType: 'it-consultation',
      message: 'Need help planning a home lab migration over the next month.',
      company: '',
    };
    req.readableEnded = true;
    req.complete = true;

    const chunks: Buffer[] = [];
    const res = {
      statusCode: 0,
      headersSent: false,
      setHeader() {},
      end(payload?: Buffer | string) {
        this.headersSent = true;
        if (payload) chunks.push(Buffer.isBuffer(payload) ? payload : Buffer.from(payload));
      },
    } as unknown as http.ServerResponse & { statusCode: number };

    req.url = '/api/services/inquiry';
    await inquiryHandler(req as unknown as http.IncomingMessage, res);
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).not.toBe(404);
    const text = Buffer.concat(chunks).toString('utf8');
    const json = JSON.parse(text) as { error?: string; ok?: boolean };
    // Without Resend env this is 503; with mocked config it could be 200.
    // Either way the body must have been read (not Zod undefined-field 400).
    expect(String(json.error ?? '')).not.toMatch(/received undefined/i);
    expect([200, 503, 502]).toContain(res.statusCode);
  });
});
