import type { UserRole } from './types';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

function secret(): string {
  return process.env.JWT_SECRET ?? 'dev-secret-change-me';
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return new Uint8Array(signature);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left[i] ^ right[i];
  return mismatch === 0;
}

export async function generateToken(user: { id: number; email: string; role: UserRole }): Promise<string> {
  const header = textToBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = textToBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    }),
  );
  const body = `${header}.${payload}`;
  const signature = bytesToBase64Url(await hmac(body));
  return `${body}.${signature}`;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = await hmac(`${header}.${payload}`);
  const actual = base64UrlToBytes(signature);
  if (!sameBytes(expected, actual)) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      sub?: unknown;
      email?: unknown;
      role?: unknown;
      exp?: unknown;
    };
    const id = Number(claims.sub);
    if (!Number.isFinite(id) || typeof claims.email !== 'string') return null;
    if (claims.role !== 'admin' && claims.role !== 'user') return null;
    if (typeof claims.exp !== 'number' || claims.exp < Math.floor(Date.now() / 1000)) return null;
    return { id, email: claims.email, role: claims.role };
  } catch {
    return null;
  }
}
