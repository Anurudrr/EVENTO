import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Globe2, Zap, ShieldCheck, Sparkles, Quote } from 'lucide-react';
import { FALLBACK_IMAGE_URL } from '../utils';

export const Values: React.FC = () => {
  const values = React.useMemo(() => [
    { 
      title: 'Global Standards', 
      desc: 'We adhere to international event management protocols, ensuring consistency and quality across all regions.',
      icon: <Globe2 className="w-8 h-8" />
    },
    { 
      title: 'Rapid Execution', 
      desc: 'Our streamlined processes and elite partner network allow us to move from concept to execution with unmatched speed.',
      icon: <Zap className="w-8 h-8" />
    },
    { 
      title: 'Unrivaled Security', 
      desc: 'From data privacy to physical event security, we prioritize the safety and confidentiality of our clients and guests.',
      icon: <ShieldCheck className="w-8 h-8" />
    },
    { 
      title: 'Precision Planning', 
      desc: 'Every detail is meticulously documented and managed through our proprietary platform for flawless delivery.',
      icon: <CheckCircle2 className="w-8 h-8" />
    },
  ], []);

  return (
    <section id="values" className="py-24 md:py-32 px-6 bg-noir-bg overflow-hidden relative border-b border-noir-border">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-4 px-8 py-3 rounded-none bg-white border border-noir-border text-noir-accent font-mono text-[10px] uppercase tracking-[0.5em] mb-10 shadow-2xl shadow-noir-accent/5"
            >
              <Sparkles className="w-4 h-4" />
              Our Philosophy
            </motion.div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-serif font-semibold text-noir-ink mb-10 tracking-wide leading-[0.95]">
              Built for <br />
              <span className="text-gradient-noir italic font-serif font-light">Timeless Grace.</span>
            </h2>
            <p className="text-xl md:text-2xl text-noir-muted leading-relaxed mb-16 max-w-2xl font-light tracking-normal">
              We've redefined event management by combining high-end artistry with rigorous professional standards. Our platform is designed to handle the complexity of modern, international events.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-10">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: i * 0.08, duration: 0.55, ease: 'easeOut' }}
                  className="flex flex-col gap-6 group"
                >
                  <div className="w-20 h-20 rounded-none bg-noir-accent/10 border border-noir-accent/20 flex items-center justify-center text-noir-accent shadow-2xl group-hover:bg-noir-accent group-hover:text-white transition-all duration-500">
                    {value.icon}
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-serif font-semibold text-noir-ink mb-4 tracking-wide group-hover:text-noir-accent transition-colors leading-snug">{value.title}</h4>
                    <p className="text-lg text-noir-muted leading-relaxed font-light tracking-normal">{value.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 rounded-none overflow-hidden shadow-[0_60px_120px_-30px_rgba(212,163,115,0.15)] border-[20px] border-white hover-float">
              <img 
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200" 
                alt="Global Excellence"
                className="w-full h-auto aspect-[4/5] object-cover transition-all duration-700 image-safe"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-noir-bg/20 to-transparent" />
            </div>
            
            {/* Floating Quote */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1 }}
              className="absolute -bottom-20 -right-20 z-20 bg-white p-16 rounded-none max-w-lg hidden md:block border border-noir-border shadow-2xl"
            >
              <div className="w-16 h-16 rounded-none bg-noir-accent/10 flex items-center justify-center text-noir-accent mb-6">
                <Quote className="w-8 h-8 fill-current" />
              </div>
              <p className="text-noir-ink font-serif font-light italic text-xl md:text-2xl leading-relaxed mb-8 tracking-normal">"EVENTO has transformed how we approach our international summits. Their precision is unmatched."</p>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-none bg-noir-accent flex items-center justify-center text-white font-semibold text-xl shadow-inner">SJ</div>
                <div>
                  <div className="text-lg md:text-xl font-semibold text-noir-ink tracking-normal uppercase">Sarah Jenkins</div>
                  <div className="text-[10px] text-noir-muted font-semibold uppercase tracking-[0.4em]">Director of Events, TechGlobal</div>
                </div>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-noir-accent/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-noir-accent/5 rounded-full blur-[150px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};
