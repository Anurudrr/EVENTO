import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Search, HelpCircle, Sparkles, MessageCircle, ArrowRight, Info } from 'lucide-react';

const FAQPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      question: "How do I book an event on EVENTO?",
      answer: "Simply browse our categories, find an event you like, select the number of seats, and click 'Book Now'. You'll be guided through our secure booking process."
    },
    {
      question: "Are the organizers on EVENTO verified?",
      answer: "Yes, every organizer on our platform undergoes a strict vetting process, including identity verification, event history review, and business license checks."
    },
    {
      question: "What is the cancellation policy?",
      answer: "Cancellation policies vary by event and organizer. You can find the specific policy on each event detail page before booking."
    },
    {
      question: "How do I pay for my booking?",
      answer: "We support all major credit cards, PayPal, and regional payment methods through our secure EVENTO Pay system."
    },
    {
      question: "Can I contact an organizer before booking?",
      answer: "Absolutely! Every event page has a 'Contact Organizer' button that allows you to chat directly with the professional."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 bg-noir-bg min-h-screen overflow-hidden relative"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[60%] bg-noir-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[50%] bg-noir-accent/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 noir-pattern opacity-10" />
      </div>

      <section className="py-32 px-6 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-8 py-3 rounded-none bg-noir-card border border-noir-border text-noir-accent text-[10px] font-mono font-semibold uppercase tracking-[0.5em] mb-10 shadow-2xl shadow-noir-accent/5"
            >
              <Sparkles className="w-4 h-4 text-noir-accent" />
              Support Center
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: "circOut" }}
              className="text-3xl md:text-[7rem] font-display font-semibold text-noir-ink mb-12 tracking-wide leading-[0.9] uppercase"
            >
              Frequently Asked <span className="text-gradient-noir italic font-sans font-light">Questions.</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-3xl mx-auto mt-16 group"
            >
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-noir-muted/40 group-focus-within:text-noir-accent transition-colors" />
              <input
                type="text"
                placeholder="SEARCH FOR ANSWERS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-noir-bg border border-noir-border rounded-none pl-20 pr-10 py-7 text-noir-ink text-xl shadow-2xl shadow-noir-accent/5 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all placeholder:text-noir-muted/30 font-mono uppercase tracking-widest"
              />
            </motion.div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-noir-card rounded-none border transition-all duration-500 overflow-hidden ${
                      activeIndex === i ? 'border-noir-accent shadow-2xl shadow-noir-accent/10' : 'border-noir-border shadow-sm hover:border-noir-accent/50'
                    }`}
                  >
                    <button
                      onClick={() => setActiveIndex(activeIndex === i ? null : i)}
                      className="w-full px-12 py-10 flex items-center justify-between text-left group"
                    >
                      <span className={`text-xl md:text-2xl font-display font-semibold transition-colors duration-500 uppercase tracking-normal ${activeIndex === i ? 'text-noir-accent' : 'text-noir-ink'}`}>
                        {faq.question}
                      </span>
                      <div className={`w-14 h-14 rounded-none flex items-center justify-center transition-all duration-500 border ${activeIndex === i ? 'bg-noir-accent text-noir-bg rotate-180 shadow-lg shadow-noir-accent/30 border-noir-accent' : 'bg-noir-bg text-noir-muted group-hover:bg-noir-accent group-hover:text-noir-bg border-noir-border group-hover:border-noir-accent'}`}>
                        {activeIndex === i ? <Minus className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {activeIndex === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "circOut" }}
                        >
                          <div className="px-12 pb-12 text-xl text-noir-muted font-light leading-relaxed border-t border-noir-border pt-8 uppercase tracking-normal">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-noir-card rounded-none border border-noir-border"
                >
                  <div className="w-24 h-24 bg-noir-bg rounded-none flex items-center justify-center text-noir-accent mx-auto mb-10 border border-noir-border">
                    <Info className="w-10 h-10 opacity-20" />
                  </div>
                  <h3 className="text-2xl font-display font-semibold text-noir-ink mb-4 uppercase tracking-wide">No answers found</h3>
                  <p className="text-noir-muted font-light uppercase tracking-widest text-sm">Try searching with different keywords.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 p-16 md:p-24 bg-noir-card rounded-none text-center text-noir-ink relative overflow-hidden group border border-noir-border shadow-2xl shadow-noir-accent/5"
          >
            <div className="absolute inset-0 noir-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-noir-accent/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-noir-bg rounded-none flex items-center justify-center text-noir-accent mb-10 group-hover:rotate-12 transition-transform duration-500 border border-noir-border">
                <MessageCircle className="w-12 h-12" />
              </div>
              <h3 className="text-xl md:text-6xl font-display font-semibold mb-6 tracking-wide uppercase leading-snug">Still have <br />questions?</h3>
              <p className="text-noir-muted text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed uppercase tracking-normal">
                Our support team is always ready to help you with any inquiries, issues, or custom requests you might have.
              </p>
              <button className="btn-noir !py-6 !px-16 !text-lg !rounded-none shadow-2xl shadow-noir-accent/20 flex items-center gap-4">
                Contact Support
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Decorative Background Text */}
      <div className="absolute top-1/2 -right-40 pointer-events-none opacity-[0.02] select-none rotate-90">
        <h2 className="text-[30vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">SUPPORT</h2>
      </div>
    </motion.div>
  );
};

export default FAQPage;
