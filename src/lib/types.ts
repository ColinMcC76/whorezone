export type BlogStatus = 'draft' | 'published';

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl: string | null;
  status: BlogStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: number;
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
}

export interface Credentials {
  email: string;
  password: string;
}

export interface AdminPostInput {
  title: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  status: BlogStatus;
}
