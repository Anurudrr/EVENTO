import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Globe, Shield, Users, ArrowRight, Heart, Zap, Star } from 'lucide-react';

const AboutPage: React.FC = () => {
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

      {/* Hero Section */}
      <section className="py-32 px-6 relative z-10 border-b border-noir-border">
        <div className="container mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-none bg-noir-accent/10 border border-noir-accent/30 text-noir-accent text-[10px] font-mono font-semibold uppercase tracking-[0.4em] mb-10"
          >
            <Sparkles className="w-4 h-4" />
            Our Story
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: "circOut" }}
            className="text-3xl md:text-[7rem] font-display font-semibold text-noir-ink mb-12 tracking-wide leading-[0.9] uppercase"
          >
            Redefining <span className="text-noir-accent italic font-serif font-normal lowercase">Celebrations.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl md:text-2xl text-noir-muted max-w-4xl mx-auto font-light leading-relaxed"
          >
            EVENTO was founded on a simple belief: every milestone deserves to be extraordinary. We connect visionary event hosts with world-class organizers to create moments that last a lifetime.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-40 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-none overflow-hidden shadow-2xl shadow-black/50 border border-noir-border aspect-[4/5] bg-noir-card">
                <img 
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80" 
                  alt="Team" 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = '/images/placeholder.png';
                  }}
                />
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-16 -right-16 bg-noir-accent p-12 rounded-none text-noir-bg shadow-2xl shadow-noir-accent/30 border border-noir-bg"
              >
                <span className="text-7xl font-display font-semibold block mb-2 tracking-wide">10k+</span>
                <span className="text-sm font-mono font-semibold uppercase tracking-[0.2em] opacity-80">Events Managed</span>
              </motion.div>
              
              {/* Floating Element */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-noir-ink rounded-none flex items-center justify-center text-noir-bg shadow-xl animate-float border border-noir-border">
                <Heart className="w-12 h-12 fill-current" />
              </div>
            </motion.div>
            
            <div className="space-y-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-display font-semibold text-noir-ink mb-10 tracking-wide leading-snug uppercase">
                  Our Mission is to <span className="italic font-serif font-normal text-noir-accent lowercase">Empower Creativity.</span>
                </h2>
                <p className="text-xl text-noir-muted leading-relaxed font-light">
                  To simplify the complex world of event planning. We provide a seamless platform where quality meets convenience, ensuring every host can focus on what truly matters: the celebration.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[
                  { icon: Globe, title: 'Global Reach', desc: 'Connecting vendors and clients across 50+ countries.', color: 'bg-noir-card text-noir-accent' },
                  { icon: Shield, title: 'Trusted Quality', desc: 'Every vendor is strictly vetted for excellence.', color: 'bg-noir-card text-noir-accent' },
                  { icon: Users, title: 'Community First', desc: 'Building a supportive network for event professionals.', color: 'bg-noir-card text-noir-accent' },
                  { icon: Zap, title: 'Innovation', desc: 'Constantly evolving the art of event technology.', color: 'bg-noir-card text-noir-accent' },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="space-y-6 group"
                  >
                    <div className={`w-16 h-16 rounded-none ${item.color} flex items-center justify-center border border-noir-border group-hover:bg-noir-accent group-hover:text-noir-bg transition-all duration-500`}>
                      <item.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-semibold text-noir-ink mb-3 tracking-wide uppercase">{item.title}</h4>
                      <p className="text-noir-muted leading-relaxed font-light">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-40 px-6 relative z-10 bg-noir-card/30 border-y border-noir-border">
        <div className="container mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-2xl md:text-6xl font-display font-semibold text-noir-ink mb-8 tracking-wide uppercase">
              The <span className="text-noir-accent italic font-serif font-normal lowercase">Values</span> That Drive Us.
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Excellence', desc: 'We never settle for "good enough". Every detail matters in creating a perfect celebration.', icon: Star },
              { title: 'Integrity', desc: 'Transparency and trust are at the heart of every connection we facilitate.', icon: Shield },
              { title: 'Passion', desc: 'We love what we do, and that energy is reflected in every event we power.', icon: Heart },
            ].map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 * i }}
                className="bg-noir-card p-12 rounded-none border border-noir-border text-center group hover:bg-noir-accent transition-all duration-700"
              >
                <div className="w-20 h-20 bg-noir-bg rounded-none flex items-center justify-center text-noir-accent mx-auto mb-10 group-hover:bg-noir-bg group-hover:text-noir-accent transition-all duration-700 border border-noir-border">
                  <value.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display font-semibold text-noir-ink mb-6 tracking-wide group-hover:text-noir-bg transition-all duration-700 uppercase">{value.title}</h3>
                <p className="text-noir-muted leading-relaxed font-light group-hover:text-noir-bg/70 transition-all duration-700">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="bg-noir-accent rounded-none p-20 md:p-32 text-center relative overflow-hidden group border border-noir-border">
            <div className="absolute inset-0 noir-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-noir-bg/20 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-noir-bg/20 rounded-full blur-[100px] -ml-48 -mb-48" />
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-7xl font-display font-semibold text-noir-bg mb-12 tracking-wide leading-[0.9] uppercase">
                Ready to Create Your <span className="italic font-serif font-normal text-noir-bg/80 lowercase">Masterpiece?</span>
              </h2>
              <div className="flex flex-wrap justify-center gap-8">
                <button className="btn-noir !bg-noir-bg !text-noir-accent !py-6 !px-16 !text-xl !rounded-none border border-noir-border hover:!bg-noir-accent hover:!text-noir-bg transition-all duration-500">
                  Get Started Now
                </button>
                <button className="btn-outline-noir !border-noir-bg/30 !text-noir-bg hover:!bg-noir-bg/10 !py-6 !px-16 !text-xl !rounded-none">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Decorative Background Text */}
      <div className="absolute top-1/2 -left-20 pointer-events-none opacity-[0.05] select-none -rotate-90">
        <h2 className="text-[25vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">ABOUT</h2>
      </div>
    </motion.div>
  );
};

export default AboutPage;
