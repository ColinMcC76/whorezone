import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  token: string | null;
  children: React.ReactElement;
}

export default function ProtectedRoute({ token, children }: ProtectedRouteProps) {
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
