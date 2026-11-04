import { describe, expect, it } from 'vitest';
import handler, { GET } from '../../api/[...path]';

describe('Vercel fetch handler', () => {
  it('answers public health and posts through the fetch export', async () => {
    expect(typeof handler.fetch).toBe('function');
    expect(typeof GET).toBe('function');

    const health = await handler.fetch(new Request('https://www.mcwhorezone.com/api/health'));
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });

    const posts = await GET(new Request('https://www.mcwhorezone.com/api/posts'));
    expect(posts.status).toBe(200);
    const body = (await posts.json()) as Array<{ slug: string; status: string }>;
    expect(body.length).toBeGreaterThan(1);
    expect(body[0]?.slug).toBe('welcome-to-my-new-site');
    expect(body.every((post) => post.status === 'published')).toBe(true);
  });
});
