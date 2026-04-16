export type UserRole = 'admin' | 'user';

export type PostStatus = 'draft' | 'published';
export type BlogPostStatus = PostStatus;

export type AuthProvider = 'local' | 'google' | 'discord';

export interface User {
  id: number;
  email: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  authProvider: AuthProvider;
  authSubject: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: number;
}
