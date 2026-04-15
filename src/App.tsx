import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminBlog from './pages/AdminBlog';
import BlogDetail from './pages/BlogDetail';
import BlogList from './pages/BlogList';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Resume from './pages/Resume';

const tokenStorageKey = 'personal-site-admin-token';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenStorageKey));

  const authHandlers = useMemo(
    () => ({
      login: (newToken: string) => {
        localStorage.setItem(tokenStorageKey, newToken);
        setToken(newToken);
      },
      logout: () => {
        localStorage.removeItem(tokenStorageKey);
        setToken(null);
      },
    }),
    [],
  );

  return (
    <div className="app-shell">
      <NavBar />
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
            element={token ? <Navigate to="/admin/blog" replace /> : <Login onLogin={authHandlers.login} />}
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute token={token}>
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