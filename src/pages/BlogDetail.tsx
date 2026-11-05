import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Chapter from '../components/Chapter';
import PageShell, { type ChapterIndexItem } from '../components/PageShell';
import { fetchPublishedPost } from '../lib/api';
import { BlogPost } from '../lib/types';

const detailIndex: ChapterIndexItem[] = [
  { id: 'post-title', label: 'Title' },
  { id: 'post-body', label: 'Reading' },
];

export default function BlogDetail() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState('');
  const index = useMemo(() => detailIndex, []);

  useEffect(() => {
    fetchPublishedPost(slug)
      .then((data) => {
        if (!data || typeof data !== 'object' || !('slug' in data)) {
          throw new Error('Invalid post payload.');
        }
        setPost(data);
      })
      .catch(() => setError('Post not found or unavailable.'));
  }, [slug]);

  if (error) {
    return (
      <PageShell label="Blog">
        <Chapter title="Unavailable" lead={error}>
          <div className="chapter-actions">
            <Link className="cta-outline" to="/blog">
              Back to blog
            </Link>
          </div>
        </Chapter>
      </PageShell>
    );
  }

  if (!post) {
    return (
      <PageShell label="Blog">
        <Chapter title="Loading" lead="Fetching the post." />
      </PageShell>
    );
  }

  return (
    <PageShell label="Blog" index={index}>
      <Chapter id="post-title" eyebrow="Post" title={post.title} lead={post.summary}>
        <div className="chapter-actions">
          <Link className="cta-outline" to="/blog">
            Back to blog
          </Link>
        </div>
      </Chapter>
      <Chapter id="post-body" className="chapter-compact">
        <div className="reading-measure prose">
          {post.content.split('\n').map((line, idx) => (
            <p key={`${post.id}-${idx}`}>{line}</p>
          ))}
        </div>
      </Chapter>
    </PageShell>
  );
}
