import type { AuthResponse, GiftView, PublicUser } from './types';

const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://127.0.0.1:4001/api' : '/api');

type ApiErrorBody = { error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = { ...(init?.headers ?? {}) };
  const method = (init?.method ?? 'GET').toUpperCase();
  if (init?.body && method !== 'GET' && method !== 'HEAD') {
    (headers as Record<string, string>)['Content-Type'] =
      (headers as Record<string, string>)['Content-Type'] ?? 'application/json';
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error('Unable to reach the gifts API.');
  }
  const body = (await response.json().catch(() => ({ error: `Request failed (${response.status})` }))) as
    | T
    | ApiErrorBody;
  if (!response.ok) {
    throw new Error((body as ApiErrorBody).error || `Request failed (${response.status})`);
  }
  return body as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function register(payload: {
  email: string;
  displayName: string;
  password: string;
}): Promise<{ user: PublicUser; message: string }> {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function getMe(token: string): Promise<{ user: PublicUser }> {
  return request('/auth/me', { headers: authHeaders(token) });
}

export function listApprovedUsers(token: string): Promise<PublicUser[]> {
  return request('/users', { headers: authHeaders(token) });
}

export function listAdminUsers(token: string): Promise<PublicUser[]> {
  return request('/admin/users', { headers: authHeaders(token) });
}

export function setUserStatus(
  token: string,
  id: number,
  status: 'pending' | 'approved' | 'rejected',
): Promise<{ user: PublicUser }> {
  return request(`/admin/users/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export function listGifts(
  token: string,
  query?: { ownerId?: number; category?: string; status?: string },
): Promise<GiftView[]> {
  const params = new URLSearchParams();
  if (query?.ownerId != null) params.set('ownerId', String(query.ownerId));
  if (query?.category) params.set('category', query.category);
  if (query?.status) params.set('status', query.status);
  const suffix = params.toString() ? `?${params}` : '';
  return request(`/gifts${suffix}`, { headers: authHeaders(token) });
}

export function createGift(
  token: string,
  payload: {
    title: string;
    notes?: string;
    url?: string;
    category?: string;
    format?: string;
    author?: string;
  },
): Promise<GiftView> {
  return request('/gifts', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateGift(
  token: string,
  id: number,
  payload: {
    title: string;
    notes?: string;
    url?: string;
    category?: string;
    format?: string;
    author?: string;
  },
): Promise<GiftView> {
  return request(`/gifts/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteGift(token: string, id: number): Promise<{ ok: true }> {
  return request(`/gifts/${id}`, { method: 'DELETE', headers: authHeaders(token) });
}

export function purchaseGift(token: string, id: number): Promise<GiftView> {
  return request(`/gifts/${id}/purchase`, { method: 'POST', headers: authHeaders(token) });
}

export function unpurchaseGift(token: string, id: number): Promise<GiftView> {
  return request(`/gifts/${id}/unpurchase`, { method: 'POST', headers: authHeaders(token) });
}
