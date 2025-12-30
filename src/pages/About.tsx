import React from 'react';

// About page describing the community and its ethos.
export default function About() {
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h2 className="section-title">About MCWhoreZone</h2>
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Our Community</h3>
        <p style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}>
          MCWhoreZone started as a small group of friends in Lexington, Kentucky who
          loved Minecraft and wanted to share that love with others. Over time, it
          has grown into a welcoming community for players of all skill levels.
          We believe gaming should be fun, inclusive and stress‑free. Whether you
          enjoy survival, building, or mini‑games, you’ll find friends and events
          to keep you entertained.
        </p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Beginner Friendly</h3>
        <p style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}>
          New to Minecraft? Don’t worry! MCWhoreZone is perfect for beginners. We
          offer helpful guides, friendly moderators and a Discord server where you
          can ask questions and get advice. From your first crafting table to
          defeating the Ender Dragon, our community will help you through every
          step of the journey.
        </p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>What We Expect</h3>
        <p style={{ color: 'var(--color-muted)', lineHeight: 1.6 }}>
          MCWhoreZone is a place of respect and camaraderie. We ask our members
          to be kind, avoid griefing, and help keep the environment friendly for
          everyone. Follow our server rules, treat others with respect, and we
          promise you’ll have a great time. If you have any questions or run
          into issues, don’t hesitate to reach out on our Discord.
        </p>
      </section>
    </div>
  );
}