import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type ChapterProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function Chapter({ id, eyebrow, title, lead, children, className }: ChapterProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        node,
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    }, node);

    return () => context.revert();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={['chapter', className].filter(Boolean).join(' ')}
      data-chapter={id}
    >
      <div className="chapter-inner">
        {eyebrow ? <p className="chapter-eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="chapter-title">{title}</h2> : null}
        {lead ? <p className="chapter-lead">{lead}</p> : null}
        {children ? <div className="chapter-body">{children}</div> : null}
      </div>
    </section>
  );
}
