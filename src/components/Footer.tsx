import React from 'react';
import { NavLink } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-closing">
      <div className="site-closing-inner">
        <p className="site-closing-label">Continue</p>
        <nav className="site-closing-routes" aria-label="Footer">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/blog">Blog</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/resume">Resume</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="site-closing-meta">
          <div className="site-closing-socials">
            <a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={siteConfig.socials.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={siteConfig.socials.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </div>
          <p className="site-closing-copy">
            © {year} {siteConfig.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
