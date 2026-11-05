import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type ChapterIndexItem = {
  id: string;
  label: string;
};

type PageShellProps = {
  label: string;
  index?: ChapterIndexItem[];
  children: React.ReactNode;
};

export default function PageShell({ label, index = [], children }: PageShellProps) {
  const [activeId, setActiveId] = useState(index[0]?.id ?? '');

  const indexKey = index.map((item) => item.id).join('|');

  useEffect(() => {
    if (!index.length) return;

    const triggers = index.map((item) =>
      ScrollTrigger.create({
        trigger: `#${item.id}`,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveId(item.id),
        onEnterBack: () => setActiveId(item.id),
      }),
    );

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [index, indexKey]);

  return (
    <div className="page-cinematic">
      <aside className="page-rail" aria-hidden="true">
        <span>{label}</span>
      </aside>

      {index.length > 0 ? (
        <nav className="page-index" aria-label={`${label} sections`}>
          {index.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={item.id === activeId ? 'is-active' : undefined}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="page-cinematic-main">{children}</div>
    </div>
  );
}
