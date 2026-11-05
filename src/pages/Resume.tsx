import Chapter from '../components/Chapter';
import PageShell from '../components/PageShell';
import { siteConfig } from '../config/siteConfig';

const { resume } = siteConfig;

const index = [
  { id: 'resume-summary', label: 'Summary' },
  { id: 'resume-experience', label: 'Experience' },
  { id: 'resume-education', label: 'Education' },
  { id: 'resume-credentials', label: 'Credentials' },
  { id: 'resume-download', label: 'Download' },
];

export default function Resume() {
  return (
    <PageShell label="Resume" index={index}>
      <Chapter
        id="resume-summary"
        eyebrow="Overview"
        title="Summary"
        lead={resume.summary}
      />

      <Chapter id="resume-experience" eyebrow="Work" title="Experience">
        {resume.experience.map((role) => (
          <article key={`${role.company}-${role.title}`} className="resume-role">
            <header className="resume-role-header">
              <h3 className="resume-role-title">{role.title}</h3>
              <p className="resume-role-org">
                {role.company} · {role.location}
              </p>
              <p className="meta">{role.dates}</p>
            </header>
            <ul className="resume-list">
              {role.bullets.map((bullet) => (
                <li key={bullet.text}>
                  {bullet.text}
                  {bullet.subItems ? (
                    <ul className="resume-sublist">
                      {bullet.subItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </Chapter>

      <Chapter id="resume-education" eyebrow="Academic" title="Education">
        {resume.education.map((entry) => (
          <article key={entry.school} className="resume-role">
            <header className="resume-role-header">
              <h3 className="resume-role-title">{entry.degree}</h3>
              <p className="resume-role-org">
                {entry.school} · {entry.location}
              </p>
              <p className="meta">{entry.dates}</p>
            </header>
            <p>{entry.note}</p>
          </article>
        ))}
      </Chapter>

      <Chapter
        id="resume-credentials"
        eyebrow="Toolkit"
        title="Certifications & Skills"
      >
        <div className="resume-credentials">
          <div>
            <h3 className="resume-role-title">Certifications</h3>
            <ul className="resume-list">
              {resume.certifications.map((cert) => (
                <li key={cert}>{cert}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="resume-role-title">Skills</h3>
            <ul className="resume-skill-list">
              {resume.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
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
