import type { AuthUser } from './types';

function secret(): string {
  return process.env.JWT_SECRET?.trim() || 'gifts-dev-secret-change-me';
}

function b64url(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function generateToken(user: AuthUser): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 14,
    }),
  );
  const data = `${header}.${payload}`;
  const key = await hmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64url(signature)}`;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const key = await hmacKey();
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    fromB64url(signature),
    new TextEncoder().encode(data),
  );
  if (!ok) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as AuthUser & {
      exp?: number;
    };
    if (!body.exp || body.exp < Date.now()) return null;
    if (!body.id || !body.email || !body.displayName || !body.role || !body.status) return null;
    return {
      id: body.id,
      email: body.email,
      displayName: body.displayName,
      role: body.role,
      status: body.status,
    };
  } catch {
    return null;
  }
}
