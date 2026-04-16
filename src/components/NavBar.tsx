import React from 'react';
import { NavLink } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';
import type { User } from '../lib/types';

interface NavBarProps {
  user: User | null;
  onLogout: () => void;
}

// Personal site navigation focused on core sections.
export default function NavBar({ user, onLogout }: NavBarProps) {

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* LEFT */}
          <div className="navbar-left">
            <div className="brand">{siteConfig.name}</div>
          </div>

          {/* CENTER */}
          <ul className="nav-links navbar-center">
            <li><NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink></li>
            <li><NavLink to="/blog" className={({ isActive }) => (isActive ? 'active' : '')}>Blog</NavLink></li>
            <li><NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>Projects</NavLink></li>
            <li><NavLink to="/resume" className={({ isActive }) => (isActive ? 'active' : '')}>Resume</NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink></li>
          </ul>

          {/* RIGHT */}
          <div className="actions navbar-right">
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
    </>
  );
}