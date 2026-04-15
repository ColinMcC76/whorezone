import { siteConfig } from '../config/siteConfig';

export default function Resume() {
  return (
    <div className="container page-wrap">
      <h1 className="section-title">Resume</h1>
      <p className="section-lead">
        A quick overview of experience and interests. Download the full version below.
      </p>

      <section className="card">
        <div className="card-title">Summary</div>
        <div className="card-content">
          <p>
            Builder focused on practical software, creative web experiences, and community-oriented tooling.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Skills</div>
        <div className="card-content">
          <p>TypeScript, React, Node.js, API design, SQL, UI/UX iteration, and technical writing.</p>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Experience Highlights</div>
        <div className="card-content">
          <ul>
            <li>Designed and shipped user-facing web applications.</li>
            <li>Built internal tools and automation workflows.</li>
            <li>Maintained and evolved community platforms and content systems.</li>
          </ul>
        </div>
      </section>

      <a className="cta" href={siteConfig.resumePdfUrl} target="_blank" rel="noopener noreferrer">
        Download PDF Resume
      </a>
    </div>
  );
}
