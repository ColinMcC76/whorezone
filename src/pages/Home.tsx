import React from 'react';
import Card from '../components/Card';
import Accordion, { AccordionItem } from '../components/Accordion';
import { siteConfig } from '../config/siteConfig';

interface HomeProps {
  showToast: (message: string) => void;
}

// Homepage containing hero, benefits, server info, gallery, FAQ preview and CTA.
export default function Home({ showToast }: HomeProps) {
  // Copy Java server address and show a toast
  const copyJava = async () => {
    await navigator.clipboard.writeText(siteConfig.javaServer.address);
    showToast('Java server address copied!');
  };
  // Copy Bedrock server address and port and show a toast
  const copyBedrock = async () => {
    await navigator.clipboard.writeText(
      `${siteConfig.bedrockServer.address}:${siteConfig.bedrockServer.port}`,
    );
    showToast('Bedrock server address copied!');
  };

  // Benefits cards data
  const benefits = [
    {
      title: 'Beginner Friendly',
      description: 'Get help from seasoned players as you learn the basics.',
      icon: '🎮',
    },
    {
      title: 'Local Community',
      description: 'Based in Lexington, KY – connect with neighbors and friends.',
      icon: '📍',
    },
    {
      title: 'Active Discord',
      description: 'Chat, share, and organise games in our lively server.',
      icon: '💬',
    },
    {
      title: 'Events & Challenges',
      description: 'Join regular events that keep the game fresh and exciting.',
      icon: '🏆',
    },
    {
      title: 'Helpful Mods',
      description: 'Friendly moderators ensure a safe and fun environment.',
      icon: '🛡️',
    },
  ];

  // Quick FAQ preview (first few items)
  const faqPreview: AccordionItem[] = [
    {
      question: 'How do I join the Java server?',
      answer:
        'Click the Play Now button or copy the Java server address and paste it into Minecraft’s server list.',
    },
    {
      question: 'Is the community suitable for beginners?',
      answer:
        'Absolutely! We cater to new players with guides, friendly members, and moderators who can answer your questions.',
    },
    {
      question: 'How do I get support?',
      answer:
        'Join our Discord server where mods and other players are ready to help with any issues or questions.',
    },
  ];

  return (
    <>
      {/* Hero banner */}
      <section
        className="hero"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url(/images/gallery1.png)',
        }}
      >
        <div className="container">
          <h1>MCWhoreZone, Lexington’s beginner‑friendly Minecraft community</h1>
          <p>Jump in, learn fast, and find people to play with.</p>
          <div className="hero-buttons">
            <button className="cta" onClick={copyJava}>
              Play Now
            </button>
            <a
              className="cta-outline"
              href={siteConfig.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section>
        <div className="container">
          <h2 className="section-title">Why Join Us?</h2>
          <div
            className="grid"
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            {benefits.map((benefit, index) => (
              <Card key={index} title={benefit.title} icon={<span>{benefit.icon}</span>}>
                {benefit.description}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Server info cards */}
      <section>
        <div className="container">
          <h2 className="section-title">Server Info</h2>
          <div
            className="grid"
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            }}
          >
            <div
              className="card"
              onClick={copyJava}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-title">Java Edition</div>
              <div className="card-content">
                <p>Address: {siteConfig.javaServer.address}</p>
                <p>Version: {siteConfig.javaServer.version}</p>
                <small style={{ color: 'var(--color-muted)' }}>Click to copy</small>
              </div>
            </div>
            <div
              className="card"
              onClick={copyBedrock}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-title">Bedrock Edition</div>
              <div className="card-content">
                <p>Address: {siteConfig.bedrockServer.address}</p>
                <p>Port: {siteConfig.bedrockServer.port}</p>
                <p>Version: {siteConfig.bedrockServer.version}</p>
                <small style={{ color: 'var(--color-muted)' }}>Click to copy</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery strip */}
      <section>
        <div className="container">
          <h2 className="section-title">Gallery</h2>
          <div
            className="gallery-grid"
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            }}
          >
            <img src="/images/gallery1.png" alt="Gallery 1" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
            <img src="/images/gallery2.png" alt="Gallery 2" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
            <img src="/images/gallery3.png" alt="Gallery 3" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
            <img src="/images/gallery4.png" alt="Gallery 4" style={{ width: '100%', borderRadius: 'var(--radius)' }} />
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section>
        <div className="container">
          <h2 className="section-title">Quick FAQ</h2>
          <Accordion items={faqPreview} />
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Ready to jump in?</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--color-muted)' }}>
            Start your adventure on MCWhoreZone today!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <button className="cta" onClick={copyJava}>
              Play Now
            </button>
            <a
              className="cta-outline"
              href={siteConfig.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>
    </>
  );
}