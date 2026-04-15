import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  return (
    <div className="container page-section">
      <h1 className="section-title">Blog</h1>
      {error && <p className="form-error">{error}</p>}
      <div className="stack">
        {posts.map((post) => (
          <article className="card" key={post.id}>
            <h2 className="card-title">{post.title}</h2>
            <p className="card-content">{post.summary}</p>
            <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft'}
            </p>
            <div style={{ marginTop: '1rem' }}>
              <Link className="cta-outline" to={`/blog/${post.slug}`}>Read post</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
