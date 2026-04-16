import crypto from 'node:crypto';
import { z } from 'zod';
import type { AuthProvider, User } from './types';
import { generateToken } from './auth';
import { createOAuthUser, findUserByProviderSubject } from './db';

const oauthStateSchema = z.object({
  provider: z.enum(['google', 'discord']),
  nonce: z.string().min(8),
  exp: z.number(),
});

function base64UrlEncode(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? 'dev-secret-change-me';
}

export function signOAuthState(payload: z.infer<typeof oauthStateSchema>): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', getJwtSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyOAuthState(token: string): z.infer<typeof oauthStateSchema> | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', getJwtSecret()).update(body).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(base64UrlDecodeToString(body));
  } catch {
    return null;
  }
  const parsed = oauthStateSchema.safeParse(parsedJson);
  if (!parsed.success) return null;
  if (parsed.data.exp < Date.now()) return null;
  return parsed.data;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`${name} is not configured`);
  }
  return v.trim();
}

export function getGoogleAuthUrl(stateToken: string): string {
  const clientId = requireEnv('GOOGLE_CLIENT_ID');
  const redirectUri = requireEnv('GOOGLE_REDIRECT_URI');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateToken,
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getDiscordAuthUrl(stateToken: string): string {
  const clientId = requireEnv('DISCORD_CLIENT_ID');
  const redirectUri = requireEnv('DISCORD_REDIRECT_URI');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state: stateToken,
    prompt: 'consent',
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

async function postForm(url: string, body: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new Error(typeof json?.error === 'string' ? json.error : 'OAuth token exchange failed');
  }
  if (!json) {
    throw new Error('OAuth token exchange returned empty body');
  }
  return json;
}

const googleTokenInfoSchema = z.object({
  email: z.string().email(),
  email_verified: z.union([z.boolean(), z.string()]).optional(),
  sub: z.string().min(1),
  name: z.string().optional(),
});

async function verifyGoogleIdToken(idToken: string, expectedClientId: string): Promise<{
  sub: string;
  email: string;
  name: string;
}> {
  const params = new URLSearchParams({ id_token: idToken });
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?${params.toString()}`);
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    throw new Error('Google id_token validation failed');
  }
  const parsed = googleTokenInfoSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Google id_token payload invalid');
  }
  const aud = json.aud;
  if (typeof aud !== 'string' || aud !== expectedClientId) {
    throw new Error('Google id_token audience mismatch');
  }
  const verified = parsed.data.email_verified;
  if (verified === false || verified === 'false') {
    throw new Error('Google email is not verified');
  }
  const name = parsed.data.name?.trim() || parsed.data.email.split('@')[0] || 'Google user';
  return { sub: parsed.data.sub, email: parsed.data.email.toLowerCase(), name };
}

export async function completeGoogleOAuth(code: string): Promise<{ token: string; user: User }> {
  const clientId = requireEnv('GOOGLE_CLIENT_ID');
  const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');
  const redirectUri = requireEnv('GOOGLE_REDIRECT_URI');
  const tokenJson = await postForm('https://oauth2.googleapis.com/token', {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const idToken = tokenJson.id_token;
  if (typeof idToken !== 'string' || !idToken) {
    throw new Error('Google token response missing id_token');
  }
  const profile = await verifyGoogleIdToken(idToken, clientId);
  let user = findUserByProviderSubject('google', profile.sub);
  if (!user) {
    user = await createOAuthUser({
      email: profile.email,
      displayName: profile.name,
      role: 'user',
      provider: 'google',
      subject: profile.sub,
    });
  }
  return { token: generateToken(user), user };
}

const discordUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().optional(),
  global_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  verified: z.boolean().optional(),
});

export async function completeDiscordOAuth(code: string): Promise<{ token: string; user: User }> {
  const clientId = requireEnv('DISCORD_CLIENT_ID');
  const clientSecret = requireEnv('DISCORD_CLIENT_SECRET');
  const redirectUri = requireEnv('DISCORD_REDIRECT_URI');
  const tokenJson = await postForm('https://discord.com/api/oauth2/token', {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const accessToken = tokenJson.access_token;
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('Discord token response missing access_token');
  }
  const meRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meJson = (await meRes.json().catch(() => null)) as unknown;
  if (!meRes.ok) {
    throw new Error('Discord user info request failed');
  }
  const parsed = discordUserSchema.safeParse(meJson);
  if (!parsed.success) {
    throw new Error('Discord user payload invalid');
  }
  const email = parsed.data.email;
  if (!email) {
    throw new Error('Discord account has no email (enable email scope or verify email on Discord)');
  }
  if (parsed.data.verified === false) {
    throw new Error('Discord email is not verified');
  }
  const display =
    parsed.data.global_name?.trim() ||
    parsed.data.username?.trim() ||
    email.split('@')[0] ||
    'Discord user';
  const subject = parsed.data.id;
  let user = findUserByProviderSubject('discord', subject);
  if (!user) {
    user = await createOAuthUser({
      email: email.toLowerCase(),
      displayName: display,
      role: 'user',
      provider: 'discord',
      subject,
    });
  }
  return { token: generateToken(user), user };
}

export async function oauthCallback(
  provider: AuthProvider,
  code: string,
): Promise<{ token: string; user: User }> {
  if (provider === 'google') {
    return completeGoogleOAuth(code);
  }
  if (provider === 'discord') {
    return completeDiscordOAuth(code);
  }
  throw new Error('Unsupported OAuth provider');
}
