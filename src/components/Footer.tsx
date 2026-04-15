import React from 'react';
import { NavLink } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-col">
          <h3>Navigate</h3>
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/blog">Blog</NavLink></li>
            <li><NavLink to="/projects">Projects</NavLink></li>
            <li><NavLink to="/resume">Resume</NavLink></li>
            <li><NavLink to="/contact">Contact</NavLink></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Elsewhere</h3>
          <ul>
            <li><a href={siteConfig.socials.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href={siteConfig.socials.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href={siteConfig.socials.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
          </ul>
        </div>

        <div className="footer-col footer-disclaimer">
          <h3>Note</h3>
          <p>
            Built as a creative personal home for projects and writing.
            Minecraft content now lives separately at{' '}
            <a href={siteConfig.minecraftArchiveUrl} target="_blank" rel="noopener noreferrer">
              archive link
            </a>.
          </p>
          <p style={{ marginTop: '0.75rem' }}>© {year} {siteConfig.name}</p>
        </div>
      </div>
    </footer>
  );
}