import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitch from '../components/ThemeSwitch';
import HoloSphereCanvas from '../home/HoloSphereCanvas';
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
  const reduceMotion = useReducedMotion();
  const { theme } = useTheme();

  return (
    <section className="landing-stage" aria-label="Landing">
      <HoloSphereCanvas reduceMotion={reduceMotion} theme={theme} />
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
