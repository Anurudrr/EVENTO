import React from 'react';
import { motion } from 'framer-motion';
import { Seo } from '../components/Seo';

const sections = [
  {
    title: 'Listing-Level Refund Rules',
    body: 'Refund eligibility is defined first by the refund policy shown on the service page. Buyers should review that policy before paying because organizer terms can differ by service type.',
  },
  {
    title: 'Gateway Payments',
    body: 'When a booking is paid through automated gateway checkout, approved refunds should be returned to the original payment method. Processing time can vary by bank or provider.',
  },
  {
    title: 'Manual UPI Fallback',
    body: 'When a booking is completed through UPI QR fallback, refund handling may require organizer confirmation and manual review because the payment is collected directly into the organizer payout account.',
  },
  {
    title: 'Support Escalation',
    body: 'If refund terms are unclear or disputed, contact EVENTO support with the booking reference, payment reference, and service title so the marketplace team can review the case.',
  },
];

const RefundPolicyPage: React.FC = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-noir-bg px-6 pb-24 pt-32">
    <Seo
      title="Refund Policy"
      description="Understand how EVENTO handles gateway refunds, manual UPI fallback refunds, and listing-level refund terms."
      path="/refund-policy"
    />
    <div className="container mx-auto max-w-4xl">
      <div className="border border-noir-border bg-noir-card p-8 md:p-12">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Legal</p>
        <h1 className="mt-4 text-4xl font-display font-semibold uppercase tracking-wide text-noir-ink md:text-5xl">Refund Policy</h1>
        <p className="mt-4 text-sm uppercase tracking-wide text-noir-muted">
          Refund outcomes depend on the listing terms, payment route, and marketplace review outcome where support intervention is needed.
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

export default RefundPolicyPage;
