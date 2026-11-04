import { describe, expect, it } from 'vitest';
import { handleApi } from '../src/httpApi';

interface ApiResult {
  status: number;
  body: any;
  headers: Headers;
}

async function api(path: string, init?: RequestInit): Promise<ApiResult> {
  const response = await handleApi(new Request(`https://www.mcwhorezone.com${path}`, init));
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
    headers: response.headers,
  };
}

async function loginAdmin(): Promise<string> {
  const response = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'change-me-admin' }),
  });
  expect(response.status).toBe(200);
  return response.body.token as string;
}

describe('CORS', () => {
  it('allows the custom domain and Vercel preview hosts', async () => {
    const production = await handleApi(
      new Request('https://www.mcwhorezone.com/api/health', {
        headers: { origin: 'https://www.mcwhorezone.com' },
      }),
    );
    expect(production.status).toBe(200);
    expect(production.headers.get('access-control-allow-origin')).toBe('https://www.mcwhorezone.com');

    const preview = await handleApi(
      new Request('https://www.mcwhorezone.com/api/health', {
        headers: { origin: 'https://whorezone-git-main-colin.vercel.app' },
      }),
    );
    expect(preview.status).toBe(200);
    expect(preview.headers.get('access-control-allow-origin')).toBe(
      'https://whorezone-git-main-colin.vercel.app',
    );
  });

  it('rejects unrelated browser origins', async () => {
    const response = await handleApi(
      new Request('https://www.mcwhorezone.com/api/health', {
        headers: { origin: 'https://evil.example' },
      }),
    );
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('Public blog', () => {
  it('returns health and published posts with no login', async () => {
    const health = await api('/api/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ ok: true });

    const posts = await api('/api/posts');
    expect(posts.status).toBe(200);
    expect(Array.isArray(posts.body)).toBe(true);
    expect(posts.body.length).toBeGreaterThan(1);
    expect(posts.body.every((post: { status: string }) => post.status === 'published')).toBe(true);
    expect(posts.body[0].slug).toBe('welcome-to-my-new-site');
    expect(posts.headers.get('content-type')).toContain('application/json');
  });

  it('returns the same public posts when the /api prefix is already stripped', async () => {
    const posts = await api('/posts');
    expect(posts.status).toBe(200);
    expect(posts.body.length).toBeGreaterThan(1);
  });

  it('returns published posts at the legacy /api/blog/posts mount', async () => {
    const posts = await api('/api/blog/posts');
    expect(posts.status).toBe(200);
    expect(posts.body[0].slug).toBe('welcome-to-my-new-site');
  });

  it('returns one published post by slug and hides drafts', async () => {
    const post = await api('/api/posts/notes-from-the-workbench');
    expect(post.status).toBe(200);
    expect(post.body.title).toBe('Notes From the Workbench');

    const draft = await api('/api/posts/private-draft');
    expect(draft.status).toBe(404);
  });
});

describe('Public registration', () => {
  it('registers a normal user with role user', async () => {
    const email = `reader-${Date.now()}@example.com`;
    const res = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        displayName: 'Test Reader',
        password: 'password-one-two-three',
      }),
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.authProvider).toBe('local');
    expect(res.body.token).toBeTruthy();
  });
});

describe('Admin post CRUD', () => {
  it('creates, updates, publishes, and deletes a post', async () => {
    const token = await loginAdmin();
    const slug = `test-post-${Date.now()}`;

    const createResponse = await api('/api/admin/posts', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        slug,
        title: 'Test Post',
        summary: 'This is a test summary for a created post.',
        content: 'This is a test body for the created post content.',
        status: 'draft',
      }),
    });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.slug).toBe(slug);
    const postId = createResponse.body.id as number;

    const hidden = await api(`/api/posts/${slug}`);
    expect(hidden.status).toBe(404);

    const updateResponse = await api(`/api/admin/posts/${postId}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        slug,
        title: 'Updated Test Post',
        summary: 'Updated summary for test post content.',
        content: 'Updated content for integration style CRUD test post.',
        status: 'draft',
      }),
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe('Updated Test Post');

    const publishResponse = await api(`/api/admin/posts/${postId}/status`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.status).toBe('published');

    const visible = await api(`/api/posts/${slug}`);
    expect(visible.status).toBe(200);

    const deleteResponse = await api(`/api/admin/posts/${postId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });

  it('blocks admin endpoints without a token', async () => {
    const response = await api('/api/admin/posts');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('creates a post with empty coverImageUrl (admin form default)', async () => {
    const token = await loginAdmin();
    const slug = `no-cover-${Date.now()}`;
    const res = await api('/api/admin/posts', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        slug,
        title: 'No cover image',
        summary: 'Summary line with enough characters.',
        content: 'Body text with enough characters for validation.',
        coverImageUrl: '',
        status: 'draft',
      }),
    });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe(slug);
    expect(res.body.coverImageUrl).toBeNull();
  });
});
