import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PyramidCanvas from '../home/PyramidCanvas';
import { siteConfig } from '../config/siteConfig';
import '../home/landing.css';

const motionQuery = '(prefers-reduced-motion: reduce)';

const landingLinks = [
  { label: 'Blog', to: '/blog' },
  { label: 'Projects', to: '/projects' },
  { label: 'Resume', to: '/resume' },
  { label: 'Contact', to: '/contact' },
];

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => window.matchMedia(motionQuery).matches);

  useEffect(() => {
    const media = window.matchMedia(motionQuery);
    const onChange = () => setReduce(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduce;
}

export default function Home() {
  const pinRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.body.classList.add('landing-open');
    return () => document.body.classList.remove('landing-open');
  }, []);

  return (
    <section className="landing" ref={pinRef} aria-label="Landing">
      <PyramidCanvas pinRef={pinRef} reduceMotion={reduceMotion} />
      <p className="landing-wordmark">{siteConfig.name}</p>
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
