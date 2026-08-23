import React from 'react';
import { motion } from 'framer-motion';
import { Seo } from '../components/Seo';

const sections = [
  {
    title: 'Before You Book',
    body: 'Every service can publish a cancellation policy on the listing page. Buyers should review the cancellation and refund terms before confirming payment.',
  },
  {
    title: 'Organizer-Led Fulfillment',
    body: 'Because organizers deliver the service directly, cancellation windows, rescheduling allowances, and non-refundable deposits can differ between listings.',
  },
  {
    title: 'Late Changes',
    body: 'Late cancellations, no-shows, venue access failures, or major scope changes may reduce eligibility for refunds or rescheduling depending on the organizer policy.',
  },
  {
    title: 'Support Review',
    body: 'If a cancellation dispute cannot be resolved directly, EVENTO support may review the booking timeline, payment route, and listing policy to determine next steps.',
  },
];

const CancellationPolicyPage: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-noir-bg px-6 pb-24 pt-32">
    <Seo
      title="Cancellation Policy"
      description="Review how EVENTO handles booking cancellations, rescheduling, and organizer-led cancellation terms."
      path="/cancellation-policy"
    />
    <div className="container mx-auto max-w-4xl">
      <div className="border border-noir-border bg-noir-card p-8 md:p-12">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Legal</p>
        <h1 className="mt-4 text-4xl font-display font-semibold uppercase tracking-wide text-noir-ink md:text-5xl">Cancellation Policy</h1>
        <p className="mt-4 text-sm uppercase tracking-wide text-noir-muted">
          Cancellation rules are designed to reflect listing-level organizer terms while still giving the marketplace a clear review process for disputes.
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

export default CancellationPolicyPage;
