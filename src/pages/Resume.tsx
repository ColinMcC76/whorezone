import Chapter from '../components/Chapter';
import PageShell from '../components/PageShell';
import { siteConfig } from '../config/siteConfig';

const index = [
  { id: 'resume-summary', label: 'Summary' },
  { id: 'resume-skills', label: 'Skills' },
  { id: 'resume-experience', label: 'Experience' },
  { id: 'resume-download', label: 'Download' },
];

export default function Resume() {
  return (
    <PageShell label="Resume" index={index}>
      <Chapter
        id="resume-summary"
        eyebrow="Overview"
        title="Summary"
        lead="Builder focused on practical software, creative web experiences, and community-oriented tooling."
      />
      <Chapter
        id="resume-skills"
        eyebrow="Toolkit"
        title="Skills"
        lead="TypeScript, React, Node.js, API design, SQL, UI/UX iteration, and technical writing."
      />
      <Chapter id="resume-experience" eyebrow="Highlights" title="Experience">
        <ul className="resume-list">
          <li>Designed and shipped user-facing web applications.</li>
          <li>Built internal tools and automation workflows.</li>
          <li>Maintained and evolved community platforms and content systems.</li>
        </ul>
      </Chapter>
      <Chapter
        id="resume-download"
        eyebrow="Full version"
        title="Download"
        lead="Get the complete resume as a PDF."
      >
        <div className="chapter-actions">
          <a className="cta" href={siteConfig.resumePdfUrl} target="_blank" rel="noopener noreferrer">
            Download PDF Resume
          </a>
        </div>
      </Chapter>
    </PageShell>
  );
}
