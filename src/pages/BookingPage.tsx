import React from 'react';
import { Booking } from '../sections/Booking';
import { motion } from 'framer-motion';

const BookingPage: React.FC = () => {
  return (
    <main className="pt-40 bg-noir-bg min-h-screen">
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-noir-accent font-mono font-semibold text-[10px] uppercase tracking-[0.5em] mb-10 block">Inquire Now</span>
            <h1 className="text-3xl md:text-8xl font-display font-semibold text-noir-ink mb-12 tracking-wide leading-[0.8] uppercase">
              Start Your <span className="text-gradient-noir italic font-sans font-light">Journey.</span>
            </h1>
            <p className="text-xl text-noir-muted max-w-2xl mx-auto font-light leading-relaxed uppercase tracking-normal">
              Let's discuss how we can make your next event truly extraordinary. Our global team is ready to assist you.
            </p>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-noir-accent/5 -z-10 blur-3xl opacity-30" />
        <div className="absolute inset-0 noir-pattern opacity-10 -z-10" />
      </section>

      <Booking />
    </main>
  );
};

export default BookingPage;
