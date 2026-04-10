import React from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Instagram, ArrowUp, Sparkles, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-noir-bg pt-24 md:pt-40 pb-12 px-6 overflow-hidden relative border-t border-noir-border">
      <div className="absolute inset-0 noir-pattern opacity-20 pointer-events-none" />

      <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-noir-accent/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[40%] h-[40%] bg-noir-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-20">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-4 mb-8 group">
              <div className="w-14 h-14 bg-noir-accent rounded-none flex items-center justify-center shadow-2xl shadow-noir-accent/20 group-hover:rotate-90 transition-transform duration-700">
                <Sparkles className="text-white w-8 h-8" />
              </div>
              <span className="text-noir-ink font-serif text-2xl font-semibold tracking-wide">EVENTO</span>
            </Link>
            <p className="text-noir-muted leading-relaxed mb-8 max-w-sm font-light text-xl tracking-normal">
              Crafting ethereal global events with a touch of aesthetic precision. Redefining the art of celebration across borders.
            </p>
            <div className="flex gap-6">
              {[Twitter, Linkedin, Instagram, Github].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ y: -8, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-none bg-white border border-noir-border flex items-center justify-center text-noir-muted hover:bg-noir-accent hover:text-white transition-all duration-500 hover:border-noir-accent shadow-xl"
                >
                  <Icon className="w-6 h-6" />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-noir-ink font-serif text-2xl font-semibold mb-8 flex items-center gap-4 tracking-widest">
              <span className="w-3 h-3 rounded-none bg-noir-accent animate-pulse" />
              Experience
            </h4>
            <ul className="space-y-6">
              {[
                { name: 'Services', href: '/events' },
                { name: 'Portfolio', href: '/portfolio' },
                { name: 'Book Event', href: '/booking' },
                { name: 'Case Studies', href: '/portfolio' }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-noir-muted hover:text-noir-accent transition-all duration-500 flex items-center gap-4 group text-lg font-mono uppercase tracking-widest">
                    <span className="w-0 group-hover:w-4 h-[2px] bg-noir-accent transition-all duration-500" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-noir-ink font-serif text-2xl font-semibold mb-8 flex items-center gap-4 tracking-widest">
              <span className="w-3 h-3 rounded-none bg-noir-accent animate-pulse" />
              Contact Us
            </h4>
            <ul className="space-y-8">
              <li className="flex items-start gap-6 text-noir-muted group">
                <div className="w-12 h-12 rounded-none bg-white border border-noir-border flex items-center justify-center shrink-0 group-hover:bg-noir-accent/20 group-hover:text-noir-accent transition-colors">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="text-lg font-light leading-relaxed tracking-normal">Vadodara, <br />India</span>
              </li>
              <li className="flex items-center gap-6 text-noir-muted group">
                <div className="w-12 h-12 rounded-none bg-white border border-noir-border flex items-center justify-center shrink-0 group-hover:bg-noir-accent/20 group-hover:text-noir-accent transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <span className="text-lg font-mono uppercase tracking-widest">sanurudh938@gmail.com</span>
              </li>
              <li className="flex items-center gap-6 text-noir-muted group">
                <div className="w-12 h-12 rounded-none bg-white border border-noir-border flex items-center justify-center shrink-0 group-hover:bg-noir-accent/20 group-hover:text-noir-accent transition-colors">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="text-lg font-mono uppercase tracking-widest">+91 7389382433</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-noir-ink font-serif text-2xl font-semibold mb-8 flex items-center gap-4 tracking-widest">
              <span className="w-3 h-3 rounded-none bg-noir-accent animate-pulse" />
              Newsletter
            </h4>
            <p className="text-noir-muted mb-10 font-light text-lg tracking-normal">Subscribe to get the latest event trends and exclusive offers.</p>
            <form className="relative group">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="w-full bg-white border border-noir-border rounded-none px-8 py-5 text-noir-ink placeholder:text-noir-muted/30 focus:outline-none focus:border-noir-accent transition-all duration-500 font-mono text-sm uppercase tracking-widest"
              />
              <button className="absolute right-3 top-3 bottom-3 bg-noir-accent hover:bg-noir-accent/80 text-white px-8 rounded-none transition-all duration-500 font-semibold text-xs uppercase tracking-widest shadow-2xl shadow-noir-accent/20">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="pt-12 border-t border-noir-border flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <p className="text-noir-muted/40 text-[10px] font-semibold uppercase tracking-[0.4em]">
              © 2026 EVENTO Global Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <a href="#" className="text-noir-muted/40 hover:text-noir-accent text-[10px] font-semibold uppercase tracking-[0.4em] transition-colors">Privacy Policy</a>
              <a href="#" className="text-noir-muted/40 hover:text-noir-accent text-[10px] font-semibold uppercase tracking-[0.4em] transition-colors">Terms of Service</a>
              <a href="#" className="text-noir-muted/40 hover:text-noir-accent text-[10px] font-semibold uppercase tracking-[0.4em] transition-colors">Cookie Settings</a>
            </div>
          </div>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -10 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-none bg-white border border-noir-border flex items-center justify-center text-noir-muted hover:bg-noir-accent hover:text-white transition-all duration-700 group hover:border-noir-accent shadow-2xl"
          >
            <ArrowUp className="w-8 h-8 group-hover:-translate-y-2 transition-transform duration-700" />
          </motion.button>
        </div>
      </div>

      <div className="absolute -bottom-32 -left-32 pointer-events-none opacity-[0.03] select-none">
        <h2 className="text-[40vw] font-serif font-semibold text-noir-accent leading-snug tracking-wide">EVENTO</h2>
      </div>
    </footer>
  );
};
