import { z } from 'zod';

export const SERVICE_TYPES = [
  'it-consultation',
  'hardware-repair',
  'software-troubleshooting',
  'mobile-support',
  'website-development',
  'website-support',
  'other',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  'it-consultation': 'IT consultation',
  'hardware-repair': 'PC / hardware repair & upgrades',
  'software-troubleshooting': 'Software & OS troubleshooting',
  'mobile-support': 'Mobile device support',
  'website-development': 'Website development (front + back)',
  'website-support': 'Website support & maintenance',
  other: 'Other / general inquiry',
};

export const serviceInquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  serviceType: z.enum(SERVICE_TYPES),
  message: z.string().trim().min(20).max(4000),
  company: z.string().max(200).optional().or(z.literal('')),
});

export type ServiceInquiryInput = z.infer<typeof serviceInquirySchema>;

export async function sendServiceInquiryEmail(
  inquiry: Omit<ServiceInquiryInput, 'company'>,
  fetchImpl: typeof fetch = (...args) => globalThis.fetch(...args),
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const to = process.env.INQUIRY_TO?.trim() || 'colinmccu@outlook.com';

  if (!apiKey || !from) {
    return {
      ok: false,
      status: 503,
      error: 'Email delivery is not configured. Please reach out via Discord or email instead.',
    };
  }

  const label = SERVICE_TYPE_LABELS[inquiry.serviceType];
  const text = [
    `New service inquiry from ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Service: ${label}`,
    '',
    'Details / scope:',
    inquiry.message,
  ].join('\n');

  let response: Response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: inquiry.email,
        subject: `Service inquiry: ${label} from ${inquiry.name}`,
        text,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reach Resend';
    return { ok: false, status: 502, error: message };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return {
      ok: false,
      status: 502,
      error: body ? `Resend error (${response.status}): ${body.slice(0, 200)}` : `Resend error (${response.status})`,
    };
  }

  return { ok: true };
}
