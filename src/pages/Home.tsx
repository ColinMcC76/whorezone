import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitch from '../components/ThemeSwitch';
import PyramidCanvas, { type PyramidCanvasHandle } from '../home/PyramidCanvas';
import { siteConfig } from '../config/siteConfig';
import { useTheme } from '../theme/ThemeProvider';
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
  const pyramidRef = useRef<PyramidCanvasHandle>(null);
  const reduceMotion = useReducedMotion();
  const { theme } = useTheme();

  return (
    <section className="landing-stage" aria-label="Landing">
      <PyramidCanvas ref={pyramidRef} reduceMotion={reduceMotion} theme={theme} />
      <p className="landing-wordmark">{siteConfig.name}</p>
      <div className="landing-tools">
        <ThemeSwitch />
        <button
          type="button"
          className="landing-restack"
          onClick={() => pyramidRef.current?.restack()}
        >
          Restack
        </button>
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
