import React from 'react';
import { NavLink } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';
import type { User } from '../lib/types';
import ThemeSwitch from './ThemeSwitch';

interface NavBarProps {
  user: User | null;
  onLogout: () => void;
}

export default function NavBar({ user, onLogout }: NavBarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <NavLink to="/" end className="brand">
            {siteConfig.name}
          </NavLink>
        </div>

        <ul className="nav-links navbar-center">
          <li>
            <NavLink to="/blog" className={({ isActive }) => (isActive ? 'active' : '')}>
              Blog
            </NavLink>
          </li>
          <li>
            <NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              Projects
            </NavLink>
          </li>
          <li>
            <NavLink to="/resume" className={({ isActive }) => (isActive ? 'active' : '')}>
              Resume
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>
              Contact
            </NavLink>
          </li>
        </ul>

        <div className="actions navbar-right">
          <ThemeSwitch />
          <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer" className="cta-outline">
            GitHub
          </a>
          {user ? (
            <>
              <NavLink to="/account" className="cta-outline">
                Account
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin/blog" className="cta">
                  Admin
                </NavLink>
              )}
              <button type="button" className="cta-outline" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="cta-outline">
                Sign in
              </NavLink>
              <NavLink to="/login?mode=register" className="cta">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
