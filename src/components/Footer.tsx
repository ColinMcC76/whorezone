import React from 'react';
import { NavLink } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';

// Footer component containing social links, a disclaimer, and quick links.
export default function Footer() {
  return (
    <footer>
  <div className="container footer-grid">
    <div className="footer-col">
      <h3>Quick Links</h3>
      <ul>
        <li><NavLink to="/">Home</NavLink></li>
        <li><NavLink to="/about">About</NavLink></li>
        <li><NavLink to="/servers">Servers</NavLink></li>
        <li><NavLink to="/shabbot">Shabbot</NavLink></li>
        <li><NavLink to="/faq">FAQ</NavLink></li>
        <li><NavLink to="/contact">Contact</NavLink></li>
      </ul>
    </div>

    <div className="footer-col">
      <h3>Community</h3>
      <ul>
        <li>
          <a href={siteConfig.discordInvite} target="_blank" rel="noopener noreferrer">
            Discord
          </a>
        </li>
        <li>
          <a
            href={`https://instagram.com/${siteConfig.instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        </li>
      </ul>
    </div>

    <div className="footer-col footer-disclaimer">
      <h3>Disclaimer</h3>
      <p>
        MCWhoreZone is an unofficial Minecraft community and is not affiliated
        with Mojang or Microsoft. All trademarks belong to their respective owners.
      </p>
    </div>
  </div>
</footer>
  );
}