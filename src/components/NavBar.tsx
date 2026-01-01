import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { siteConfig } from '../config/siteConfig';
import Modal from './Modal';

interface NavBarProps {
  onPlayNow: () => void;
  showToast: (message: string) => void;
}

// Navigation bar with persistent CTA buttons and a Discord login placeholder.
export default function NavBar({ onPlayNow }: NavBarProps) {
  const [showModal, setShowModal] = useState(false);

  // Open the placeholder modal for Discord login
  const handleDiscordLogin = () => {
    setShowModal(true);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* LEFT */}
          <div className="navbar-left">
            <div className="brand">MCWhoreZone</div>
          </div>

          {/* CENTER */}
          <ul className="nav-links navbar-center">
            <li><NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink></li>
            <li><NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>About</NavLink></li>
            <li><NavLink to="/servers" className={({ isActive }) => (isActive ? 'active' : '')}>Servers</NavLink></li>
            <li><NavLink to="/shabbot" className={({ isActive }) => (isActive ? 'active' : '')}>Shabbot</NavLink></li>
            <li><NavLink to="/faq" className={({ isActive }) => (isActive ? 'active' : '')}>FAQ</NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink></li>
          </ul>

          {/* RIGHT */}
          <div className="actions navbar-right">
            <button className="cta" onClick={onPlayNow}>Play Now</button>
            <a href={siteConfig.discordInvite} target="_blank" rel="noopener noreferrer" className="cta-outline">
              Join Discord
            </a>
            <button className="login" onClick={handleDiscordLogin}>
              Login with Discord
            </button>
          </div>
        </div>
      </nav>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2>Discord Login Coming Soon</h2>
          <p>We're working on integrating Discord authentication. Stay tuned!</p>
          <button className="cta" onClick={() => setShowModal(false)}>
            Close
          </button>
        </Modal>
      )}
    </>
  );
}