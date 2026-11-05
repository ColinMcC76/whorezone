import { Link } from 'react-router-dom';
import Chapter from '../components/Chapter';
import PageShell from '../components/PageShell';
import { siteConfig } from '../config/siteConfig';

const projects = [
  {
    id: 'website-rebuild',
    title: 'Personal Website Rebuild',
    description:
      'A full redesign that moves from one niche focus to a broader personal home with writing and project stories.',
    stack: 'React, TypeScript, Express, SQLite',
  },
  {
    id: 'community-bots',
    title: 'Community Bot Experiments',
    description:
      'Automation scripts and small bot tools for organizing events and reducing repetitive tasks in online communities.',
    stack: 'Node.js, APIs',
  },
  {
    id: 'ui-prototypes',
    title: 'Creative UI Prototypes',
    description:
      'A set of playful interface experiments exploring layouts, motion, and visual hierarchy for personal sites.',
    stack: 'React, CSS',
  },
];

const index = [
  { id: 'projects-intro', label: 'Intro' },
  ...projects.map((project) => ({ id: project.id, label: project.title })),
];

export default function Projects() {
  return (
    <PageShell label="Projects" index={index}>
      <Chapter
        id="projects-intro"
        eyebrow="Selected work"
        title="Projects"
        lead="Things I have built, explored, or iterated on recently."
      />
      {projects.map((project) => (
        <Chapter key={project.id} id={project.id} title={project.title} lead={project.description}>
          <p className="meta">{project.stack}</p>
        </Chapter>
      ))}
      <Chapter
        id="projects-next"
        eyebrow="Next"
        title="Collaborate"
        lead="Want to work together? Reach out through GitHub or the contact page."
      >
        <div className="chapter-actions">
          <a className="cta" href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <Link className="cta-outline" to="/contact">
            Contact
          </Link>
        </div>
      </Chapter>
    </PageShell>
  );
}
