import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Home from './pages/Home';
import About from './pages/About';
import Servers from './pages/Servers';
import Shabbot from './pages/Shabbot';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import { siteConfig } from './config/siteConfig';

// The top‑level component defines global layout and routing.
export default function App() {
  const [toast, setToast] = useState('');

  // Show a toast message for a short duration
  const showToast = (message: string) => {
    setToast(message);
    // Hide the toast after 3 seconds
    setTimeout(() => setToast(''), 3000);
  };

  // Copy the Java server address to the clipboard and show a toast
  const handlePlayNow = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.javaServer.address);
      showToast('Server address copied to clipboard!');
    } catch (err) {
      showToast('Unable to copy to clipboard');
    }
  };

  return (
    <div className="app">
      <NavBar onPlayNow={handlePlayNow} showToast={showToast} />
      <main>
        <Routes>
          <Route path="/" element={<Home showToast={showToast} />} />
          <Route path="/about" element={<About />} />
          <Route path="/servers" element={<Servers showToast={showToast} />} />
          <Route path="/shabbot" element={<Shabbot />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      {toast && <Toast message={toast} />}
    </div>
  );
}