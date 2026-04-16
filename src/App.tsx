import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminBlog from './pages/AdminBlog';
import Account from './pages/Account';
import AuthCallback from './pages/AuthCallback';
import BlogDetail from './pages/BlogDetail';
import BlogList from './pages/BlogList';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Resume from './pages/Resume';
import { authApi } from './lib/api';
import type { User } from './lib/types';

const tokenStorageKey = 'personal-site-token';
const userStorageKey = 'personal-site-user';

function readStoredUser(): User | null {
  const raw = localStorage.getItem(userStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (typeof parsed.id !== 'number' || typeof parsed.email !== 'string') return null;
    return {
      id: parsed.id,
      email: parsed.email,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : parsed.email,
      role: parsed.role === 'admin' ? 'admin' : 'user',
      authProvider: parsed.authProvider ?? 'local',
    };
  } catch {
    return null;
  }
}

function AppRoutes() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenStorageKey));
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const persistAuth = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(tokenStorageKey, newToken);
    localStorage.setItem(userStorageKey, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(userStorageKey);
    setToken(null);
    setUser(null);
  }, []);

  const authHandlers = useMemo(
    () => ({
      login: persistAuth,
      logout: clearAuth,
    }),
    [persistAuth, clearAuth],
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const fresh = await authApi.getMe(token);
        if (!cancelled) {
          setUser(fresh);
          localStorage.setItem(userStorageKey, JSON.stringify(fresh));
        }
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, clearAuth]);

  const onAuthSuccess = useCallback(
    (newToken: string, newUser: User) => {
      persistAuth(newToken, newUser);
      if (newUser.role === 'admin') {
        navigate('/admin/blog', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    },
    [navigate, persistAuth],
  );

  return (
    <div className="app-shell">
      <NavBar user={user} onLogout={authHandlers.logout} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to={user?.role === 'admin' ? '/admin/blog' : '/account'} replace />
              ) : (
                <Login onAuthSuccess={onAuthSuccess} />
              )
            }
          />
          <Route path="/auth/callback" element={<AuthCallback onAuthSuccess={onAuthSuccess} />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute token={token} user={user}>
                {token && user ? (
                  <Account
                    token={token}
                    user={user}
                    onUserUpdate={(u) => {
                      setUser(u);
                      localStorage.setItem(userStorageKey, JSON.stringify(u));
                    }}
                    onTokenUpdate={(t) => {
                      localStorage.setItem(tokenStorageKey, t);
                      setToken(t);
                    }}
                    onLogout={authHandlers.logout}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute token={token} user={user} requireAdmin>
                <AdminBlog token={token ?? ''} onAuthError={authHandlers.logout} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return <AppRoutes />;
}
