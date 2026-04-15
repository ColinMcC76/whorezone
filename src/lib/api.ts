import type { AdminPostInput, AuthResponse, BlogPost, Credentials, User } from './types';

const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

interface ApiError {
  error: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const method = (init?.method ?? 'GET').toUpperCase();
  const hasBody = init?.body != null && init.body !== '';
  const headers: HeadersInit = { ...(init?.headers ?? {}) };
  if (hasBody && method !== 'GET' && method !== 'HEAD') {
    (headers as Record<string, string>)['Content-Type'] =
      (headers as Record<string, string>)['Content-Type'] ?? 'application/json';
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('API request timed out. Please try again.');
    }
    throw new Error('Unable to reach the API. Please check backend deployment.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({ error: `Request failed (${response.status})` }))) as ApiError;
    throw new Error(body.error || 'Request failed');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Unexpected API response format.');
  }

  return response.json() as Promise<T>;
}

export function fetchPublishedPosts(): Promise<BlogPost[]> {
  return request<BlogPost[]>('/blog/posts');
}

export function fetchPublishedPost(slug: string): Promise<BlogPost> {
  return request<BlogPost>(`/blog/posts/${slug}`);
}

export async function login(credentials: Credentials): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(credentials: Credentials & { displayName: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function fetchAdminPosts(token: string): Promise<BlogPost[]> {
  return request<BlogPost[]>('/admin/posts', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createPost(token: string, payload: AdminPostInput): Promise<BlogPost> {
  return request<BlogPost>('/admin/posts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updatePost(token: string, id: number, payload: Partial<AdminPostInput>): Promise<BlogPost> {
  return request<BlogPost>(`/admin/posts/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deletePost(token: string, id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/admin/posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function publishPost(token: string, id: number): Promise<BlogPost> {
  return request<BlogPost>(`/admin/posts/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'published' }),
  });
}

export function unpublishPost(token: string, id: number): Promise<BlogPost> {
  return request<BlogPost>(`/admin/posts/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'draft' }),
  });
}

export const blogApi = {
  list: fetchPublishedPosts,
  listPublished: fetchPublishedPosts,
  getBySlug: fetchPublishedPost,
  listAll: fetchAdminPosts,
  create: createPost,
  update: updatePost,
  remove: deletePost,
  publish: publishPost,
  unpublish: unpublishPost,
};

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> =>
    login({ email, password }),
  register,
};
