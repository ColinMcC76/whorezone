import { describe, expect, it, vi } from 'vitest';
import { signOAuthState, verifyOAuthState } from '../src/oauth';

describe('OAuth state signing', () => {
  it('round-trips and rejects tampering', () => {
    vi.stubEnv('JWT_SECRET', 'test-secret-for-oauth-state');
    const token = signOAuthState({
      provider: 'google',
      nonce: 'abcdefghijklmnop',
      exp: Date.now() + 60_000,
    });
    expect(verifyOAuthState(token)).toMatchObject({ provider: 'google' });
    expect(verifyOAuthState(`${token}x`)).toBeNull();
    vi.unstubAllEnvs();
  });

  it('rejects expired state', () => {
    vi.stubEnv('JWT_SECRET', 'test-secret-for-oauth-state');
    const token = signOAuthState({
      provider: 'google',
      nonce: 'abcdefghijklmnop',
      exp: Date.now() - 1,
    });
    expect(verifyOAuthState(token)).toBeNull();
    vi.unstubAllEnvs();
  });
});
