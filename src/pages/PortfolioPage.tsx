import React from 'react';
import { Portfolio } from '../sections/Portfolio';
import { Gallery } from '../sections/Gallery';
import { motion } from 'framer-motion';

const PortfolioPage: React.FC = () => {
  return (
    <main className="pt-32 bg-noir-bg">
      <section className="relative py-24 px-6 overflow-hidden border-b border-noir-border">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-noir-accent font-mono font-semibold text-[10px] uppercase tracking-[0.5em] mb-6 block">Our Work</span>
            <h1 className="text-6xl md:text-[10rem] font-display font-semibold text-noir-ink mb-8 tracking-wide leading-[0.8] uppercase">
              The <span className="text-gradient-noir italic font-sans font-light">Portfolio.</span>
            </h1>
            <p className="text-xl md:text-xl text-noir-muted max-w-4xl mx-auto font-light leading-relaxed uppercase tracking-normal">
              A curated collection of our most iconic global events, from high-fashion galas to corporate summits.
            </p>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-noir-accent/5 -z-10 blur-[150px] opacity-30" />
        <div className="absolute inset-0 noir-pattern opacity-5 pointer-events-none" />
      </section>

      <Portfolio />
      <Gallery />
    </main>
  );
};

export default PortfolioPage;
