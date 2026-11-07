import React from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitch from '../components/ThemeSwitch';
import { siteConfig } from '../config/siteConfig';
import '../home/landing.css';

const landingLinks = [
  { label: 'Blog', to: '/blog' },
  { label: 'Projects', to: '/projects' },
  { label: 'Services', to: '/services' },
  { label: 'Resume', to: '/resume' },
  { label: 'Contact', to: '/contact' },
];

export default function Home() {
  return (
    <section className="landing-stage" aria-label="Landing">
      <p className="landing-wordmark">{siteConfig.name}</p>
      <div className="landing-tools">
        <ThemeSwitch />
      </div>
      <nav className="landing-nav" aria-label="Site">
        {landingLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
