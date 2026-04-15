import React, { FormEvent, useEffect, useState } from 'react';
import { blogApi } from '../lib/api';
import { AdminPostInput, BlogPost } from '../lib/types';

interface AdminBlogProps {
  token: string;
  onAuthError: () => void;
}

const initialForm: AdminPostInput = {
  title: '',
  summary: '',
  content: '',
  coverImageUrl: '',
  status: 'draft',
};

export default function AdminBlog({ token, onAuthError }: AdminBlogProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminPostInput>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPosts = async () => {
    try {
      const data = await blogApi.listAll(token);
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts.');
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        onAuthError();
      }
    }
  };

  useEffect(() => {
    void loadPosts();
  }, [token]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (editingId) {
        await blogApi.update(token, editingId, form);
        setMessage('Post updated.');
      } else {
        await blogApi.create(token, form);
        setMessage('Post created.');
      }
      resetForm();
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        onAuthError();
      }
    }
  };

  const onEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      summary: post.summary,
      content: post.content,
      coverImageUrl: post.coverImageUrl ?? '',
      status: post.status,
    });
    setError(null);
    setMessage(null);
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this post?')) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await blogApi.remove(token, id);
      setMessage('Post deleted.');
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        onAuthError();
      }
    }
  };

  const onPublishToggle = async (post: BlogPost) => {
    setError(null);
    setMessage(null);
    try {
      if (post.status === 'published') {
        await blogApi.unpublish(token, post.id);
        setMessage(`"${post.title}" moved back to draft.`);
      } else {
        await blogApi.publish(token, post.id);
        setMessage(`"${post.title}" published.`);
      }
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status change failed.');
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        onAuthError();
      }
    }
  };

  return (
    <div className="container page-shell">
      <h1 className="section-title">Admin Blog Dashboard</h1>
      <p className="page-copy">Create, edit, publish, and curate your blog posts.</p>

      <form onSubmit={onSubmit} className="admin-form">
        <h2>{editingId ? 'Edit Post' : 'Create Post'}</h2>
        <label>
          Title
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>
        <label>
          Summary
          <textarea
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            rows={3}
            required
          />
        </label>
        <label>
          Cover image URL (optional)
          <input
            value={form.coverImageUrl}
            onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })}
          />
        </label>
        <label>
          Content
          <textarea
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            rows={9}
            required
          />
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as AdminPostInput['status'] })
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <div className="admin-form-actions">
          <button className="cta" type="submit">
            {editingId ? 'Save Changes' : 'Create Post'}
          </button>
          {editingId && (
            <button className="cta-outline" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.status}</td>
                <td>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}</td>
                <td className="table-actions">
                  <button className="cta-outline" onClick={() => onEdit(post)} type="button">
                    Edit
                  </button>
                  <button className="cta-outline" onClick={() => onPublishToggle(post)} type="button">
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="cta-outline danger" onClick={() => onDelete(post.id)} type="button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
