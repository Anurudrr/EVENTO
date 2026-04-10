import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export const Booking: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <section id="booking" className="py-24 md:py-32 px-6 bg-noir-bg relative overflow-hidden">
      <div className="absolute inset-0 noir-pattern pointer-events-none opacity-10" />
      <div className="container mx-auto relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-noir-accent font-mono font-semibold text-[10px] uppercase tracking-[0.5em] mb-8 block">Get in Touch</span>
            <h2 className="text-2xl md:text-[6rem] font-serif font-semibold text-noir-ink tracking-wide mb-6 leading-[0.9]">
              Let's plan your <br />
              <span className="text-gradient-noir italic font-serif font-light">Next Event.</span>
            </h2>
            <p className="text-xl text-noir-muted leading-relaxed mb-8 max-w-lg font-light tracking-normal">
              Whether it's a global summit or an intimate celebration, our team is ready to bring your vision to life with precision, artistry, and a touch of aesthetic luxury.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-center gap-8 group">
                <div className="w-20 h-20 rounded-none bg-white flex items-center justify-center text-noir-accent group-hover:bg-noir-accent group-hover:text-white transition-all duration-500 shadow-2xl border border-noir-border">
                  <Phone className="w-8 h-8" />
                </div>
                <div>
                  <span className="block text-noir-muted text-[10px] font-mono font-semibold uppercase tracking-[0.3em] mb-2">Call Us</span>
                  <span className="text-noir-ink text-2xl font-serif font-semibold tracking-wide uppercase">+1 (800) EVENTO-GLOBAL</span>
                </div>
              </div>
              
              <div className="flex items-center gap-8 group">
                <div className="w-20 h-20 rounded-none bg-white flex items-center justify-center text-noir-accent group-hover:bg-noir-accent group-hover:text-white transition-all duration-500 shadow-2xl border border-noir-border">
                  <Mail className="w-8 h-8" />
                </div>
                <div>
                  <span className="block text-noir-muted text-[10px] font-mono font-semibold uppercase tracking-[0.3em] mb-2">Email Support</span>
                  <span className="text-noir-ink text-2xl font-serif font-semibold tracking-wide uppercase">hello@evento.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-none shadow-2xl border border-noir-border relative">
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-noir-accent rounded-none flex items-center justify-center text-white animate-pulse border border-noir-border shadow-2xl">
              <Sparkles className="w-10 h-10" />
            </div>
            
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-noir-bg border border-noir-border px-8 py-5 text-noir-ink rounded-none focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all font-mono uppercase tracking-widest placeholder:text-noir-muted/30"
                        placeholder="JOHN DOE"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Work Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full bg-noir-bg border border-noir-border px-8 py-5 text-noir-ink rounded-none focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all font-mono uppercase tracking-widest placeholder:text-noir-muted/30"
                        placeholder="JOHN@COMPANY.COM"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Event Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full bg-noir-bg border border-noir-border px-8 py-5 text-noir-ink rounded-none focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all font-mono uppercase tracking-widest"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Event Category</label>
                      <select className="w-full bg-noir-bg border border-noir-border px-8 py-5 text-noir-ink rounded-none focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all appearance-none font-mono uppercase tracking-widest">
                        <option className="bg-white">Corporate Summit</option>
                        <option className="bg-white">Product Launch</option>
                        <option className="bg-white">Private Gala</option>
                        <option className="bg-white">Wedding</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest ml-1">Brief Description</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-noir-bg border border-noir-border px-8 py-5 text-noir-ink rounded-none focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all resize-none font-mono uppercase tracking-widest placeholder:text-noir-muted/30"
                      placeholder="TELL US A BIT ABOUT YOUR EVENT..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full btn-noir !py-6 font-serif text-lg uppercase tracking-widest flex items-center justify-center gap-4 group"
                  >
                    Send Inquiry
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-28 h-28 bg-noir-accent text-white rounded-none flex items-center justify-center mx-auto mb-12 shadow-2xl border border-noir-border">
                    <CheckCircle2 className="w-14 h-14" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-noir-ink mb-8 tracking-wide uppercase">Inquiry Sent!</h3>
                  <p className="text-noir-muted text-xl max-w-xs mx-auto font-light tracking-normal">
                    Thank you for reaching out. Our team will review your request and get back to you within 24 hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-noir-accent/5 -skew-x-12 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-noir-accent/5 skew-x-12 -translate-x-1/2 pointer-events-none" />
    </section>
  );
};
