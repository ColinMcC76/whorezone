import Chapter from '../components/Chapter';
import PageShell from '../components/PageShell';
import { siteConfig } from '../config/siteConfig';

export default function Contact() {
  return (
    <PageShell label="Contact">
      <Chapter
        eyebrow="Reach out"
        title="Contact"
        lead="Collaborations, IT projects, or a simple hello."
      >
        <div className="chapter-actions">
          <a className="cta" href={`mailto:${siteConfig.email}`}>
            Email Me
          </a>
          <a
            className="cta-outline"
            href={siteConfig.socials.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            className="cta-outline"
            href={siteConfig.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
        <p className="meta contact-email">
          Prefer direct email? <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </p>
      </Chapter>
    </PageShell>
  );
}
