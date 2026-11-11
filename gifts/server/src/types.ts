export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'member';
export type GiftStatus = 'open' | 'purchased';

export type User = {
  id: number;
  email: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type Gift = {
  id: number;
  ownerId: number;
  title: string;
  notes: string;
  url: string | null;
  category: string;
  format: string | null;
  author: string | null;
  status: GiftStatus;
  purchasedById: number | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
};

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
};

export type GiftView = Omit<Gift, 'purchasedById'> & {
  ownerName: string;
  purchasedByName: string | null;
  purchasedById: number | null;
};
