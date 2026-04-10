import React from 'react';

const JOURNEY_STEPS = [
  { index: '01', label: 'Find Services' },
  { index: '02', label: 'Compare Options' },
  { index: '03', label: 'Book Instantly' },
] as const;

export const HeroJourneyCard: React.FC = React.memo(() => {
  return (
    <article
      className="relative overflow-hidden rounded-[34px] border border-black/10 bg-[rgba(250,245,237,0.64)] p-6 shadow-[0_30px_110px_rgba(95,67,39,0.16)] backdrop-blur-[28px] md:p-8"
      data-hero-float
    >
      <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-noir-accent/22 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/38 blur-3xl" />

      <div className="relative">
        <span className="hero-kicker hero-kicker--soft">EVENTO Journey</span>
        <h2 className="mt-5 font-serif text-3xl leading-tight text-noir-ink md:text-4xl">
          From Discovery to Booking
        </h2>
        <p className="mt-4 max-w-sm text-base leading-8 text-noir-muted/85 md:text-lg">
          A calmer path from first search to confirmed booking.
        </p>
      </div>

      <div className="relative mt-8 grid gap-5">
        {JOURNEY_STEPS.map((step, index) => (
          <div
            key={step.index}
            data-hero-card-item
            className={`grid grid-cols-[auto_1fr] items-center gap-4 ${
              index > 0 ? 'border-t border-black/8 pt-5' : ''
            }`}
          >
            <span className="font-mono text-sm font-semibold tracking-[0.24em] text-noir-accent">
              {step.index}
            </span>
            <span className="text-lg text-noir-ink/92 md:text-xl">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
});
