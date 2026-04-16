import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

interface AuthResult {
  token: string;
}

async function loginAdmin(): Promise<AuthResult> {
  const response = await request(app).post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'change-me-admin',
  });

  expect(response.status).toBe(200);
  return { token: response.body.token as string };
}

describe('API health and blog routes', () => {
  beforeAll(async () => {
    await loginAdmin();
  });

  it('returns health payload', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('returns published posts to public clients', async () => {
    const response = await request(app).get('/api/posts');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('returns published posts at legacy /api/blog/posts mount', async () => {
    const response = await request(app).get('/api/blog/posts');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe('Public registration', () => {
  it('registers a normal user with role user', async () => {
    const email = `reader-${Date.now()}@example.com`;
    const res = await request(app).post('/api/auth/register').send({
      email,
      displayName: 'Test Reader',
      password: 'password-one-two-three',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.authProvider).toBe('local');
    expect(res.body.token).toBeTruthy();
  });
});

describe('Admin post CRUD', () => {
  it('creates, updates, publishes, and deletes a post', async () => {
    const { token } = await loginAdmin();
    const slug = `test-post-${Date.now()}`;

    const createResponse = await request(app)
      .post('/api/admin/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug,
        title: 'Test Post',
        summary: 'This is a test summary for a created post.',
        content: 'This is a test body for the created post content.',
        status: 'draft',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.slug).toBe(slug);
    const postId = createResponse.body.id as number;

    const updateResponse = await request(app)
      .put(`/api/admin/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug,
        title: 'Updated Test Post',
        summary: 'Updated summary for test post content.',
        content: 'Updated content for integration style CRUD test post.',
        status: 'draft',
      });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe('Updated Test Post');

    const publishResponse = await request(app)
      .patch(`/api/admin/posts/${postId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' });
    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.status).toBe('published');

    const deleteResponse = await request(app)
      .delete(`/api/admin/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);
  });

  it('blocks admin endpoints without a token', async () => {
    const response = await request(app).get('/api/admin/posts');
    expect(response.status).toBe(401);
  });

  it('creates a post with empty coverImageUrl (admin form default)', async () => {
    const { token } = await loginAdmin();
    const slug = `no-cover-${Date.now()}`;
    const res = await request(app)
      .post('/api/admin/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug,
        title: 'No cover image',
        summary: 'Summary line with enough characters.',
        content: 'Body text with enough characters for validation.',
        coverImageUrl: '',
        status: 'draft',
      });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe(slug);
    expect(res.body.coverImageUrl).toBeNull();
  });
});
