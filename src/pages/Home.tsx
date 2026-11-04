import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitch from '../components/ThemeSwitch';
import PyramidCanvas from '../home/PyramidCanvas';
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
  const scrollRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { theme } = useTheme();

  return (
    <section className="landing-scroll" ref={scrollRef} aria-label="Landing">
      <div className="landing-stage">
        <PyramidCanvas scrollRef={scrollRef} reduceMotion={reduceMotion} theme={theme} />
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
      </div>
    </section>
  );
}
