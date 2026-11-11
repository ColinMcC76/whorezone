export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type GiftStatus = 'open' | 'purchased';

export type PublicUser = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
};

export type GiftView = {
  id: number;
  ownerId: number;
  ownerName: string;
  title: string;
  notes: string;
  url: string | null;
  category: string;
  format: string | null;
  author: string | null;
  status: GiftStatus;
  purchasedById: number | null;
  purchasedByName: string | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
};
