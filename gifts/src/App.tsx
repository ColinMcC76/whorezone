import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import { getMe } from './lib/api';
import type { PublicUser } from './lib/types';
import Admin from './pages/Admin';
import Home from './pages/Home';
import Login from './pages/Login';
import MyList from './pages/MyList';
import Register from './pages/Register';

const tokenKey = 'gifts-token';
const userKey = 'gifts-user';

function readUser(): PublicUser | null {
  try {
    const raw = localStorage.getItem(userKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicUser;
    if (!parsed?.id || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenKey));
  const [user, setUser] = useState<PublicUser | null>(() => readUser());

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    setToken(null);
    setUser(null);
  }, []);

  const onAuth = useCallback((nextToken: string, nextUser: PublicUser) => {
    localStorage.setItem(tokenKey, nextToken);
    localStorage.setItem(userKey, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then((result) => {
        setUser(result.user);
        localStorage.setItem(userKey, JSON.stringify(result.user));
      })
      .catch(() => logout());
  }, [token, logout]);

  return (
    <div className="app-shell">
      <NavBar user={user} onLogout={logout} />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              token && user ? <Home token={token} user={user} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/mine"
            element={
              token && user ? <MyList token={token} user={user} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/admin"
            element={
              token && user?.role === 'admin' ? (
                <Admin token={token} />
              ) : (
                <Navigate to={token ? '/' : '/login'} replace />
              )
            }
          />
          <Route
            path="/login"
            element={token && user ? <Navigate to="/" replace /> : <Login onAuth={onAuth} />}
          />
          <Route
            path="/register"
            element={token && user ? <Navigate to="/" replace /> : <Register />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-closing">
        <div className="site-closing-inner">Family gift lists · gifts.mcwhorezone.com</div>
      </footer>
    </div>
  );
}
