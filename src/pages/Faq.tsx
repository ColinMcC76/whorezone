import React from 'react';
import Accordion, { AccordionItem } from '../components/Accordion';

// Full FAQ page with common questions and answers for beginners and Discord users.
export default function Faq() {
  const faqs: AccordionItem[] = [
    {
      question: 'How do I add the server in Minecraft?',
      answer:
        'Java: Multiplayer → Add Server → play.mcwhorezone.com. Bedrock: Servers → Add Server → br.mcwhorezone.com. If the Java list says the server is sleeping, a Java join wakes it; Bedrock can connect after it is up.',
    },
    {
      question: 'What version of Minecraft do I need?',
      answer:
        'The world is on Minecraft 26.3 for both Java and Bedrock. Update your client to that version before joining.',
    },
    {
      question: 'Can I join if I’m under 18?',
      answer:
        'Yes! We welcome players of all ages. However, minors should ensure they have a parent’s permission and follow our community guidelines.',
    },
    {
      question: 'Do you allow mods or hacks?',
      answer:
        'We do not allow hacks or cheating. Client‑side mods that don’t give unfair advantages (like OptiFine or mini‑maps) are generally fine. For modded servers, use our approved pack.',
    },
    {
      question: 'How can I get help if I’m stuck?',
      answer:
        'Our Discord is the best place for support. Head to the #help channel and describe your issue. Moderators and experienced players will assist you.',
    },
    {
      question: 'What are the rules?',
      answer:
        'The short version: be respectful, no griefing, no cheating, and keep chat appropriate. A complete list of rules is pinned in the #rules channel on Discord.',
    },
    {
      question: 'How do I earn ranks?',
      answer:
        'Ranks are based on activity, contributions and participation in events. We occasionally run promotions and community votes. Check Discord for announcements.',
    },
    {
      question: 'Can I invite my friends?',
      answer:
        'Absolutely! Share our Discord invite link or server IP with friends. The more the merrier — just make sure they follow the rules too.',
    },
    {
      question: 'Is voice chat required?',
      answer:
        'Voice chat is optional. Many players enjoy hanging out in voice channels, but you can also stick to text chat if you prefer.',
    },
  ];

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h2 className="section-title">Frequently Asked Questions</h2>
      <Accordion items={faqs} />
    </div>
  );
}