import React from 'react';
import Card from '../components/Card';
import { siteConfig } from '../config/siteConfig';

interface ServersProps {
  showToast: (message: string) => void;
}

// Servers page listing different modes with descriptions and join instructions.
export default function Servers({ showToast }: ServersProps) {
  const copyAddress = async () => {
    await navigator.clipboard.writeText(siteConfig.javaServer.address);
    showToast('Server address copied!');
  };

  const modes = [
    {
      name: 'Survival',
      description:
        'Classic Minecraft survival with a friendly twist. Explore, build and conquer while respecting others’ builds.',
      rules: 'No griefing, no cheating, keep chat friendly.',
      version: siteConfig.javaServer.version,
    },
    {
      name: 'Creative',
      description:
        'Unleash your imagination with unlimited resources. Perfect for building massive structures or practicing designs.',
      rules: 'No griefing other plots, share builds in Discord.',
      version: siteConfig.javaServer.version,
    },
    {
      name: 'Modded',
      description:
        'Experiment with carefully curated mods for a fresh experience. From tech to magic, there’s something for everyone.',
      rules: 'Install our mod pack, follow additional guidelines in Discord.',
      version: siteConfig.javaServer.version,
    },
    {
      name: 'Events',
      description:
        'Special event servers such as UHC, building competitions and holiday themes. Keep an eye on Discord for announcements.',
      rules: 'Event rules vary – check announcements.',
      version: siteConfig.javaServer.version,
    },
  ];

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h2 className="section-title">Our Servers</h2>
      <div
        className="grid"
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        }}
      >
        {modes.map((mode, idx) => (
          <Card key={idx} title={mode.name} icon={<span>🧩</span>}>
            <p style={{ marginBottom: '0.5rem' }}>{mode.description}</p>
            <p style={{ marginBottom: '0.5rem', fontStyle: 'italic', color: 'var(--color-muted)' }}>
              Rules: {mode.rules}
            </p>
            <p style={{ marginBottom: '0.5rem' }}>Version: {mode.version}</p>
            <button
              className="cta-outline"
              onClick={copyAddress}
              style={{ marginTop: '0.5rem' }}
            >
              Copy IP
            </button>
          </Card>
        ))}
      </div>
      <p style={{ marginTop: '2rem', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
        Tip: Use the IP copied above for all modes. Specific instructions and mod
        packs are available on Discord.
      </p>
    </div>
  );
}