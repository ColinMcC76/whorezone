import React from 'react';
import { NavLink } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';

// Personal site navigation focused on core sections.
export default function NavBar() {

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
            <NavLink to="/admin/blog" className="cta">Admin</NavLink>
          </div>
        </div>
      </nav>
    </>
  );
}