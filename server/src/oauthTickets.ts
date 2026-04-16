import crypto from 'node:crypto';
import type { User } from './types';

type TicketPayload = {
  exp: number;
  token: string;
  user: Pick<User, 'id' | 'email' | 'displayName' | 'role' | 'authProvider'>;
};

const tickets = new Map<string, TicketPayload>();

export function issueOAuthTicket(
  token: string,
  user: User,
): string {
  const id = crypto.randomBytes(24).toString('base64url');
  tickets.set(id, {
    exp: Date.now() + 5 * 60 * 1000,
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      authProvider: user.authProvider,
    },
  });
  return id;
}

export function consumeOAuthTicket(
  ticket: string,
): { token: string; user: TicketPayload['user'] } | null {
  const row = tickets.get(ticket);
  if (!row || row.exp < Date.now()) {
    tickets.delete(ticket);
    return null;
  }
  tickets.delete(ticket);
  return { token: row.token, user: row.user };
}
