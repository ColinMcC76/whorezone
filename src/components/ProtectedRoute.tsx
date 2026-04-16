import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User } from '../lib/types';

interface ProtectedRouteProps {
  token: string | null;
  user: User | null;
  requireAdmin?: boolean;
  children: React.ReactElement;
}

export default function ProtectedRoute({
  token,
  user,
  requireAdmin,
  children,
}: ProtectedRouteProps) {
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/account" replace />;
  }
  return children;
}
