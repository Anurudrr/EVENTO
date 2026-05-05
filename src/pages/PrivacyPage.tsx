import React from 'react';
import { motion } from 'framer-motion';
import { Seo } from '../components/Seo';

const sections = [
  {
    title: 'Information We Collect',
    body: 'EVENTO collects account details, booking details, organizer profile details, uploaded images, and payment references required to operate the marketplace and support bookings.',
  },
  {
    title: 'How We Use Data',
    body: 'We use your information to authenticate accounts, process bookings, support payments, surface organizer trust details, respond to support requests, and improve marketplace operations.',
  },
  {
    title: 'Sharing and Retention',
    body: 'Buyer booking details are shared with the booked organizer. Organizer profile details may appear publicly on service pages. We retain records for security, support, and operational compliance.',
  },
  {
    title: 'Security and Contact',
    body: 'We use role-based access controls and marketplace review flows to protect data, but no platform can guarantee perfect security. For privacy requests, contact the support details listed on the site.',
  },
];

const PrivacyPage: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-noir-bg px-6 pb-24 pt-32">
    <Seo
      title="Privacy Policy"
      description="Read how EVENTO collects, uses, and protects buyer, organizer, booking, and payment data across the marketplace."
      path="/privacy"
    />
    <div className="container mx-auto max-w-4xl">
      <div className="border border-noir-border bg-noir-card p-8 md:p-12">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Legal</p>
        <h1 className="mt-4 text-4xl font-display font-semibold uppercase tracking-wide text-noir-ink md:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm uppercase tracking-wide text-noir-muted">
          This policy explains how EVENTO handles personal data for marketplace accounts, bookings, organizer profiles, and payment support.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="border border-noir-border bg-noir-bg p-6">
              <h2 className="text-lg font-display font-semibold uppercase tracking-wide text-noir-ink">{section.title}</h2>
              <p className="mt-3 text-sm uppercase tracking-wide text-noir-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

export default PrivacyPage;
