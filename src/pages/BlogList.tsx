import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Chapter from '../components/Chapter';
import PageShell from '../components/PageShell';
import { blogApi } from '../lib/api';
import { BlogPost } from '../lib/types';

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    blogApi
      .listPublished()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error('Invalid blog data format.');
        }
        setPosts(data);
      })
      .catch(() => setError('Could not load blog posts yet. Ensure the API is running.'));
  }, []);

  const index = useMemo(
    () => [
      { id: 'blog-intro', label: 'Intro' },
      ...posts.map((post) => ({ id: `post-${post.slug}`, label: post.title })),
    ],
    [posts],
  );

  return (
    <PageShell label="Blog" index={index}>
      <Chapter
        id="blog-intro"
        eyebrow="Writing"
        title="Blog"
        lead="Thoughts, experiments, and updates from the workbench."
      >
        {error ? <p className="form-error">{error}</p> : null}
      </Chapter>
      {posts.map((post) => (
        <Chapter key={post.id} id={`post-${post.slug}`} className="chapter-compact">
          <article className="post-band">
            <h2 className="post-band-title">{post.title}</h2>
            <p>{post.summary}</p>
            <p className="post-band-meta">
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}
            </p>
            <div className="chapter-actions">
              <Link className="cta-outline" to={`/blog/${post.slug}`}>
                Read post
              </Link>
            </div>
          </article>
        </Chapter>
      ))}
    </PageShell>
  );
}
