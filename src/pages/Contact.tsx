import { siteConfig } from '../config/siteConfig';

// Contact page with direct contact channels and social links.
export default function Contact() {
  return (
    <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
      <h2 className="section-title">Contact</h2>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-muted)' }}>
        Reach out for collaborations, project ideas, or just to say hello.
      </p>
      <a
        className="cta"
        href={`mailto:${siteConfig.email}`}
        style={{ marginBottom: '1rem', display: 'inline-block' }}
      >
        Email Me
      </a>
      <p style={{ marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>
        Social links
      </p>
      <a
        className="cta-outline"
        href={siteConfig.socials.github}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginRight: '0.75rem' }}
      >
        GitHub
      </a>
      <a className="cta-outline" href={siteConfig.socials.linkedin} target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      <p style={{ marginTop: '2rem', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
        Prefer direct email?{' '}
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