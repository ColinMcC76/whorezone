import { siteConfig } from '../config/siteConfig';

const projects = [
  {
    title: 'Personal Website Rebuild',
    description:
      'A full redesign that moves from one niche focus to a broader personal home with writing and project stories.',
    stack: 'React, TypeScript, Express, SQLite',
  },
  {
    title: 'Community Bot Experiments',
    description:
      'Automation scripts and small bot tools for organizing events and reducing repetitive tasks in online communities.',
    stack: 'Node.js, APIs',
  },
  {
    title: 'Creative UI Prototypes',
    description:
      'A set of playful interface experiments exploring layouts, motion, and visual hierarchy for personal sites.',
    stack: 'React, CSS',
  },
];

export default function Projects() {
  return (
    <div className="container page-wrap">
      <h1 className="section-title">Projects</h1>
      <p className="section-lead">
        Selected things I have built, explored, or iterated on recently.
      </p>
      <div className="project-grid">
        {projects.map((project) => (
          <article key={project.title} className="card">
            <div className="card-title">{project.title}</div>
            <div className="card-content">
              <p>{project.description}</p>
              <p className="meta">{project.stack}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="section-lead">
        Want to collaborate? Reach out through the <a href={siteConfig.socials.github}>GitHub profile</a> or the contact page.
      </p>
    </div>
  );
}
