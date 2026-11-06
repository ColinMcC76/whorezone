import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleApi } from '../src/httpApi';

interface ApiResult {
  status: number;
  body: any;
}

async function api(path: string, init?: RequestInit): Promise<ApiResult> {
  const response = await handleApi(new Request(`https://www.mcwhorezone.com${path}`, init));
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

const validBody = {
  name: 'Alex Client',
  email: 'alex@example.com',
  serviceType: 'website-development',
  message: 'Need a small business site with contact form and blog, timeline about four weeks.',
  company: '',
};

describe('Service inquiry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    delete process.env.INQUIRY_TO;
  });

  it('rejects invalid payloads', async () => {
    const response = await api('/api/services/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'not-an-email',
        serviceType: 'not-real',
        message: 'too short',
      }),
    });
    expect(response.status).toBe(400);
    expect(String(response.body.error)).toMatch(/name|email|serviceType|message/i);
  });

  it('rejects filled honeypot fields', async () => {
    const response = await api('/api/services/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validBody, company: 'Bot Corp' }),
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/unable to submit/i);
  });

  it('returns 503 when Resend is not configured', async () => {
    const response = await api('/api/services/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(response.status).toBe(503);
    expect(String(response.body.error)).toMatch(/not configured/i);
  });

  it('sends a Resend email for a valid inquiry', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM = 'Services <inquiries@example.com>';
    process.env.INQUIRY_TO = 'colinmccu@outlook.com';

    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'email_123' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await api('/api/services/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key');

    const payload = JSON.parse(String(init.body));
    expect(payload.from).toBe('Services <inquiries@example.com>');
    expect(payload.to).toEqual(['colinmccu@outlook.com']);
    expect(payload.reply_to).toBe('alex@example.com');
    expect(payload.subject).toContain('Website development');
    expect(payload.subject).toContain('Alex Client');
    expect(payload.text).toContain('alex@example.com');
    expect(payload.text).toContain(validBody.message);
  });
});
