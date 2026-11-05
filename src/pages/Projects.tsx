import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Chapter from '../components/Chapter';
import PageShell from '../components/PageShell';
import { siteConfig } from '../config/siteConfig';

type GithubRepoCard = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  homepage: string | null;
};

const index = [
  { id: 'projects-intro', label: 'Intro' },
  { id: 'projects-repos', label: 'Repos' },
  { id: 'projects-next', label: 'Collaborate' },
];

function formatPushedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Projects() {
  const [repos, setRepos] = useState<GithubRepoCard[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch('/github-repos.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load repos (${response.status})`);
        const data = (await response.json()) as unknown;
        if (!Array.isArray(data)) throw new Error('Invalid repos snapshot');
        if (cancelled) return;
        const cards = data.filter(
          (item): item is GithubRepoCard =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as GithubRepoCard).name === 'string' &&
            typeof (item as GithubRepoCard).html_url === 'string',
        );
        setRepos(cards);
        setStatus(cards.length ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!cancelled) {
          setRepos([]);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell label="Projects" index={index}>
      <Chapter
        id="projects-intro"
        eyebrow="Selected work"
        title="Projects"
        lead="Public repositories from GitHub, refreshed whenever the site builds."
      />

      <Chapter
        id="projects-repos"
        className="chapter-wide"
        eyebrow="GitHub"
        title="Repositories"
      >
        {status === 'loading' ? <p className="meta">Loading repositories…</p> : null}
        {status === 'error' ? (
          <p className="meta">
            Couldn’t load the repository snapshot. Visit{' '}
            <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
              github.com/{siteConfig.githubUsername}
            </a>{' '}
            directly.
          </p>
        ) : null}
        {status === 'empty' ? (
          <p className="meta">No public repositories to show yet.</p>
        ) : null}
        {status === 'ready' ? (
          <div className="project-grid">
            {repos.map((repo) => {
              const pushed = formatPushedAt(repo.pushed_at);
              const metaBits = [
                repo.language,
                `${repo.stargazers_count}★`,
                pushed ? `Updated ${pushed}` : null,
              ].filter(Boolean);

              return (
                <article key={repo.html_url} className="card repo-card">
                  <h3 className="card-title">
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                      {repo.name}
                    </a>
                  </h3>
                  <p className="card-content">{repo.description || 'No description yet.'}</p>
                  <p className="meta repo-card-meta">{metaBits.join(' · ')}</p>
                  <div className="repo-card-actions">
                    <a
                      className="cta-outline"
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on GitHub
                    </a>
                    {repo.homepage ? (
                      <a
                        className="cta-outline"
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Homepage
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </Chapter>

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
