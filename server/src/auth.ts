import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

interface TokenClaims {
  sub: number;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: { id: number; email: string; role: UserRole }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function parseToken(req: Request): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length);
  try {
    const claims = jwt.verify(token, JWT_SECRET) as TokenClaims;
    return { id: claims.sub, email: claims.email, role: claims.role };
  } catch {
    return null;
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const user = parseToken(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  req.user = user;
  next();
}
