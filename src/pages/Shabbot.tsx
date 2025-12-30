import React from 'react';
import Accordion, { AccordionItem } from '../components/Accordion';

// Shabbot page describing the community bot and its commands.
export default function Shabbot() {
  const features = [
    {
      title: 'Moderation Tools',
      description:
        'Auto‑moderation features keep chat civil by filtering slurs and spam. Moderators can also mute, kick, and ban with simple commands.',
    },
    {
      title: 'Fun Commands',
      description:
        'Run mini‑games, fetch memes, roll dice and more. Shabbot keeps your chat lively with engaging activities.',
    },
    {
      title: 'Role Tools',
      description:
        'Let users assign roles via reactions or commands. Organise players by interests or server access level.',
    },
    {
      title: 'Server Notifications',
      description:
        'Receive automatic updates when Minecraft servers go online/offline or when events start. Stay informed without leaving Discord.',
    },
  ];

  const commands: AccordionItem[] = [
    {
      question: '!help',
      answer: 'Displays a list of all available commands and their descriptions.',
    },
    {
      question: '!play <song name>',
      answer: 'Plays music in your voice channel from YouTube.',
    },
    {
      question: '!warn @user <reason>',
      answer: 'Issues a warning to the mentioned user with an optional reason.',
    },
    {
      question: '!role add <role>',
      answer: 'Assigns yourself a specified role if you have permission.',
    },
    {
      question: '!serverstatus',
      answer: 'Returns the current status of the Minecraft servers.',
    },
    {
      question: '!event',
      answer: 'Shows information about the next scheduled community event.',
    },
  ];

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h2 className="section-title">Shabbot – Your Discord Companion</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--color-muted)' }}>
        Shabbot is our custom Discord bot designed to enhance your MCWhoreZone
        experience. From moderation to fun commands and automatic server
        notifications, Shabbot has your back.
      </p>
      <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Key Features</h3>
      <div
        className="grid"
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          marginBottom: '2rem',
        }}
      >
        {features.map((feature, idx) => (
          <div key={idx} className="card">
            <div className="card-title">{feature.title}</div>
            <div className="card-content">{feature.description}</div>
          </div>
        ))}
      </div>
      <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Commands</h3>
      <Accordion items={commands} />
    </div>
  );
}