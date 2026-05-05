import React from 'react';
import { motion } from 'framer-motion';
import { Seo } from '../components/Seo';

const sections = [
  {
    title: 'Marketplace Role',
    body: 'EVENTO provides the software layer for discovery, booking coordination, organizer profiles, and supported payment flows. Service fulfillment remains the responsibility of the organizer and buyer.',
  },
  {
    title: 'Account Responsibilities',
    body: 'Users must provide accurate account details, protect their login credentials, and avoid fraudulent bookings, payment claims, review abuse, or organizer impersonation.',
  },
  {
    title: 'Organizer Responsibilities',
    body: 'Organizers must publish accurate listing content, pricing, policies, payout details, and fulfillment expectations. Verified status may be revoked if information becomes inaccurate or misleading.',
  },
  {
    title: 'Payments, Cancellations, and Disputes',
    body: 'Payment handling may use automated gateway checkout or manual UPI fallback depending on configuration. Listing-level cancellation and refund policies apply unless marketplace support states otherwise.',
  },
];

const TermsPage: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-noir-bg px-6 pb-24 pt-32">
    <Seo
      title="Terms of Service"
      description="Review the marketplace rules, organizer responsibilities, payment terms, and booking conditions for using EVENTO."
      path="/terms"
    />
    <div className="container mx-auto max-w-4xl">
      <div className="border border-noir-border bg-noir-card p-8 md:p-12">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Legal</p>
        <h1 className="mt-4 text-4xl font-display font-semibold uppercase tracking-wide text-noir-ink md:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm uppercase tracking-wide text-noir-muted">
          These terms govern how buyers, organizers, and admins use the EVENTO marketplace and related booking flows.
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

export default TermsPage;
