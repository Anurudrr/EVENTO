import React from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../constants';
import { CategoryCard } from '../components/CategoryCard';
import { SearchBar } from '../components/SearchBar';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ExplorePage: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 bg-noir-bg min-h-screen overflow-hidden relative"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[70%] bg-noir-accent/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[60%] bg-noir-accent/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 noir-pattern opacity-5" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-4 px-8 py-3 rounded-none bg-noir-card border border-noir-border text-noir-accent font-mono text-[10px] uppercase tracking-[0.5em] mb-8 shadow-2xl shadow-noir-accent/5"
          >
            <Sparkles className="w-4 h-4 text-noir-accent" />
            Discover Events
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: "circOut" }}
            className="text-3xl md:text-[8rem] font-display font-semibold text-noir-ink mb-8 tracking-wide leading-[0.8] uppercase"
          >
            Explore <span className="text-gradient-noir italic font-sans font-light">Categories.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl md:text-xl text-noir-muted max-w-5xl mx-auto font-light leading-relaxed mb-12 uppercase tracking-normal"
          >
            Find the perfect events for every occasion, from photography workshops to music festivals.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <SearchBar />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-noir-border divide-x divide-y divide-noir-border">
          {CATEGORIES.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * (index % 6) }}
              className="p-0"
            >
              <CategoryCard category={category} />
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 p-12 md:p-20 bg-noir-card rounded-none text-center text-noir-ink relative overflow-hidden group border border-noir-border shadow-2xl shadow-noir-accent/5"
        >
          <div className="absolute inset-0 noir-pattern opacity-5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-noir-accent/10 rounded-full blur-[150px] -mr-80 -mt-80" />
          
          <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-2xl md:text-7xl font-display font-semibold mb-10 tracking-wide leading-[0.8] uppercase">
              Can't find what you're <br />
              <span className="italic font-sans font-light text-noir-accent">looking for?</span>
            </h3>
            <p className="text-noir-muted text-xl md:text-2xl mb-16 max-w-3xl mx-auto font-light leading-relaxed uppercase tracking-normal">
              Explore all our events or contact us for a custom event planning experience tailored just for you.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <Link to="/events" className="btn-noir !py-6 !px-16 !text-lg !rounded-none shadow-2xl shadow-noir-accent/20 flex items-center gap-4">
                View All Events
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link to="/contact" className="btn-outline-noir !py-6 !px-16 !text-lg !rounded-none">
                Contact Support
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative Background Text */}
      <div className="absolute top-1/2 -left-40 pointer-events-none opacity-[0.02] select-none -rotate-90">
        <h2 className="text-[30vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">EXPLORE</h2>
      </div>
    </motion.div>
  );
};

export default ExplorePage;
