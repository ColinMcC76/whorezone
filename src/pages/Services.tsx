import React, { FormEvent, useMemo, useState } from 'react';
import Chapter from '../components/Chapter';
import PageShell from '../components/PageShell';
import { siteConfig } from '../config/siteConfig';
import { submitServiceInquiry } from '../lib/api';

const { services } = siteConfig;

const index = [
  { id: 'services-intro', label: 'Intro' },
  { id: 'services-offerings', label: 'Offerings' },
  { id: 'services-inquire', label: 'Inquire' },
];

type SubmitState = 'idle' | 'sending' | 'success' | 'error';

export default function Services() {
  const defaultService = services.offerings[0]?.id ?? 'other';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState(defaultService);
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  const selectedOffering = useMemo(
    () => services.offerings.find((item) => item.id === serviceType),
    [serviceType],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      await submitServiceInquiry({
        name,
        email,
        serviceType,
        message,
        company,
      });
      setStatus('success');
      setName('');
      setEmail('');
      setServiceType(defaultService);
      setMessage('');
      setCompany('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to send inquiry.');
    }
  };

  return (
    <PageShell label="Services" index={index}>
      <Chapter
        id="services-intro"
        eyebrow="Work with me"
        title="Services"
        lead={services.intro}
      />

      <Chapter
        id="services-offerings"
        eyebrow="What I offer"
        title="Offerings"
        lead="Pick the lane that fits, then send details about scope, timeline, and constraints."
      >
        <ul className="services-list">
          {services.offerings.map((offering) => (
            <li key={offering.id} className="services-item">
              <h3 className="services-item-title">{offering.title}</h3>
              <p>{offering.description}</p>
            </li>
          ))}
        </ul>
      </Chapter>

      <Chapter
        id="services-inquire"
        eyebrow="Next step"
        title="Inquire"
        lead="Tell me who you are, what you need, and the scope. I will reply by email."
      >
        {status === 'success' ? (
          <p className="success-message">
            Inquiry sent. I will get back to you at the email you provided.
          </p>
        ) : (
          <form className="admin-form services-form" onSubmit={onSubmit} noValidate>
            <label>
              Name
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={200}
              />
            </label>
            <label>
              Service type
              <select
                name="serviceType"
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                required
              >
                {services.offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offering.title}
                  </option>
                ))}
              </select>
            </label>
            {selectedOffering ? (
              <p className="meta services-form-hint">{selectedOffering.description}</p>
            ) : null}
            <label>
              Details / scope
              <textarea
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                minLength={20}
                maxLength={4000}
                rows={6}
                placeholder="Describe the device, site, timeline, and what success looks like."
              />
            </label>
            <label className="services-honeypot" aria-hidden="true">
              Company
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </label>
            <div className="admin-form-actions">
              <button className="cta" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send inquiry'}
              </button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </form>
        )}
        <p className="meta contact-email">
          Prefer Discord or direct email?{' '}
          <a href={siteConfig.socials.discord} target="_blank" rel="noopener noreferrer">
            Join Discord
          </a>{' '}
          or write{' '}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </Chapter>
    </PageShell>
  );
}
