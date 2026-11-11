import React from 'react';
import { NavLink } from 'react-router-dom';
import type { PublicUser } from '../lib/types';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  user: PublicUser | null;
  onLogout: () => void;
};

export default function NavBar({ user, onLogout }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" end>
          Gifts
        </NavLink>
        <ul className="nav-links">
          {user ? (
            <>
              <li>
                <NavLink to="/" end>
                  Wishlists
                </NavLink>
              </li>
              <li>
                <NavLink to="/mine">My list</NavLink>
              </li>
              {user.role === 'admin' ? (
                <li>
                  <NavLink to="/admin">Admin</NavLink>
                </li>
              ) : null}
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login">Sign in</NavLink>
              </li>
              <li>
                <NavLink to="/register">Request access</NavLink>
              </li>
            </>
          )}
        </ul>
        <div className="actions">
          <label className="theme-switch">
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            <input type="checkbox" checked={theme === 'light'} onChange={toggle} />
          </label>
          {user ? (
            <>
              <span className="meta">{user.displayName}</span>
              <button type="button" className="cta-outline" onClick={onLogout}>
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
