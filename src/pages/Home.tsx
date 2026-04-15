import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { siteConfig } from '../config/siteConfig';

export default function Home() {
  const quickLinks = [
    { title: 'Blog', to: '/blog', description: 'Read thoughts, experiments, and updates.' },
    { title: 'Projects', to: '/projects', description: 'Explore things I have built and shipped.' },
    { title: 'Resume', to: '/resume', description: 'View my experience and download my resume.' },
    { title: 'Contact', to: '/contact', description: 'Reach out for collaboration or conversation.' },
  ];

  return (
    <>
      <section className="hero hero-personal">
        <div className="container">
          <p className="eyebrow">Personal hub</p>
          <h1>{siteConfig.name}</h1>
          <p>{siteConfig.intro}</p>
          <div className="hero-buttons">
            <Link className="cta" to="/projects">
              View Projects
            </Link>
            <Link className="cta-outline" to="/blog">
              Read Blog
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <h2 className="section-title">Explore the site</h2>
          <div className="grid cards-grid">
            {quickLinks.map((link) => (
              <Card key={link.to} title={link.title}>
                <p>{link.description}</p>
                <Link to={link.to} className="inline-link">
                  Open {link.title}
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}