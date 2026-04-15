import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPublishedPost } from '../lib/api';
import { BlogPost } from '../lib/types';

export default function BlogDetail() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublishedPost(slug)
      .then(setPost)
      .catch(() => setError('Post not found or unavailable.'));
  }, [slug]);

  if (error) {
    return (
      <div className="container page-section">
        <p className="form-error">{error}</p>
        <Link to="/blog">Back to blog</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container page-section">
        <p>Loading post...</p>
      </div>
    );
  }

  return (
    <article className="container page-section">
      <Link to="/blog">← Back to blog</Link>
      <h1 className="section-title" style={{ textAlign: 'left', marginTop: '1rem' }}>{post.title}</h1>
      <p style={{ color: 'var(--color-muted)' }}>{post.summary}</p>
      <div className="prose" style={{ marginTop: '1.5rem' }}>
        {post.content.split('\n').map((line, idx) => (
          <p key={`${post.id}-${idx}`}>{line}</p>
        ))}
      </div>
    </article>
  );
}
