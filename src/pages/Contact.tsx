import React from 'react';
import { siteConfig } from '../config/siteConfig';

// Contact page encouraging users to join Discord for support.
export default function Contact() {
  return (
    <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
      <h2 className="section-title">Contact Us</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-muted)' }}>
        Need help or just want to chat? The best way to reach us is through
        Discord. Our moderators and community members are ready to assist you.
      </p>
      <a
        className="cta"
        href={siteConfig.discordInvite}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginBottom: '1rem', display: 'inline-block' }}
      >
        Join Discord
      </a>
      <p style={{ marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>
        You can also follow us on Instagram:
      </p>
      <a
        className="cta-outline"
        href={`https://instagram.com/${siteConfig.instagramHandle}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        @{siteConfig.instagramHandle}
      </a>
      <p style={{ marginTop: '2rem', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
        Prefer email? Reach us at{' '}
        <a
          href={`mailto:${siteConfig.email}`}
          style={{ color: 'var(--color-accent)' }}
        >
          {siteConfig.email}
        </a>
      </p>
    </div>
  );
}