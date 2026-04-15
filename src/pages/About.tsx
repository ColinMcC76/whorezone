import React from 'react';
import { siteConfig } from '../config/siteConfig';

export default function About() {
  return (
    <div className="container page-shell">
      <h1 className="section-title">About</h1>
      <p className="page-copy">{siteConfig.intro}</p>
      <div className="stacked-cards">
        <article className="card">
          <h2 className="card-title">What this site is for</h2>
          <div className="card-content">
            <p>
              This is my personal home base for writing, publishing project updates, and keeping a living
              archive of ideas that matter to me.
            </p>
          </div>
        </article>
        <article className="card">
          <h2 className="card-title">How I use it</h2>
          <div className="card-content">
            <p>
              I use this site as both a creative lab and a practical hub: public posts for the blog, curated
              projects, and a resume that stays current.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}