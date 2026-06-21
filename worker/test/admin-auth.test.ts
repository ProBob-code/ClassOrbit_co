import { describe, it, expect, vi } from 'vitest';
import { signAdminToken, verifyAdminToken, makeCookie, ADMIN_COOKIE } from '../src/lib/admin-auth';

describe('admin token', () => {
  const secret = 'admin_jwt_secret';

  it('verifies a freshly signed token', async () => {
    const token = await signAdminToken(secret);
    expect(await verifyAdminToken(token, secret)).toBe(true);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signAdminToken(secret);
    expect(await verifyAdminToken(token, 'other_secret')).toBe(false);
  });

  it('rejects a tampered payload', async () => {
    const token = await signAdminToken(secret);
    const [data, sig] = token.split('.');
    const tampered = `${data}x.${sig}`;
    expect(await verifyAdminToken(tampered, secret)).toBe(false);
  });

  it('rejects garbage', async () => {
    expect(await verifyAdminToken('not-a-token', secret)).toBe(false);
    expect(await verifyAdminToken('', secret)).toBe(false);
  });

  it('rejects an expired token', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const token = await signAdminToken(secret);
      // jump 25h forward — past the 24h expiry
      vi.setSystemTime(new Date('2026-01-02T01:00:00Z'));
      expect(await verifyAdminToken(token, secret)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('makeCookie', () => {
  it('sets an HttpOnly cookie with the token', () => {
    const cookie = makeCookie('tok123');
    expect(cookie).toContain(`${ADMIN_COOKIE}=tok123`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Max-Age=');
  });

  it('clears the cookie with Max-Age=0', () => {
    const cookie = makeCookie('', true);
    expect(cookie).toContain('Max-Age=0');
  });
});
