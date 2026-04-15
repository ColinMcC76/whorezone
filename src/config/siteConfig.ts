export const siteConfig = {
  name: 'My Personal Hub',
  tagline: 'Ideas, projects, and writing in one creative home.',
  intro:
    'This is my corner of the internet for sharing projects, writing, and things I am exploring.',
  email: 'hello@example.com',
  socials: {
    github: 'https://github.com/example',
    linkedin: 'https://linkedin.com/in/example',
    instagram: 'https://instagram.com/example',
  },
  resumePdfUrl: '/resume.pdf',
  minecraftArchiveUrl: 'https://minecraft.example.com',
  projects: [
    {
      title: 'Personal Analytics Dashboard',
      summary: 'A private dashboard that tracks habits and writing progress.',
      stack: ['React', 'TypeScript', 'SQLite'],
      href: '#',
    },
    {
      title: 'Community Event Planner',
      summary: 'A lightweight event planner for friends and local community meetups.',
      stack: ['Node.js', 'Express', 'PostgreSQL'],
      href: '#',
    },
    {
      title: 'CLI Notes Sync Tool',
      summary: 'A terminal-first sync utility for markdown notes and snippets.',
      stack: ['TypeScript', 'Node.js'],
      href: '#',
    },
  ],
};

export type SiteConfig = typeof siteConfig;