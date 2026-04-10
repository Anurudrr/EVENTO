import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Briefcase, Star, ArrowRight, Sparkles } from 'lucide-react';

const ExpertiseCard = React.memo(({ service, index }: { service: any, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: 'easeOut' }}
      className="group p-8 bg-white border border-noir-border rounded-none hover:border-noir-accent hover:shadow-[0_40px_80px_-20px_rgba(212,163,115,0.1)] transition-all duration-700 relative overflow-hidden h-full flex flex-col"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-noir-accent/5 rounded-full -mr-24 -mt-24 transition-opacity duration-500 group-hover:opacity-80" />
      
      <div className="w-20 h-20 rounded-none bg-noir-accent/10 border border-noir-accent/20 flex items-center justify-center text-noir-accent mb-8 group-hover:bg-noir-accent group-hover:text-white transition-colors duration-500 relative z-10 shadow-xl">
        {service.icon}
      </div>
      <h3 className="text-xl md:text-2xl font-serif font-semibold text-noir-ink mb-6 relative z-10 tracking-wide leading-snug">
        {service.title}
      </h3>
      <p className="text-noir-muted leading-relaxed mb-8 relative z-10 font-light text-lg flex-grow tracking-normal">
        {service.desc}
      </p>
      <button className="flex items-center gap-4 text-[10px] font-semibold text-noir-accent uppercase tracking-[0.4em] group/btn relative z-10 hover:text-noir-ink transition-colors">
        Discover More
        <div className="w-10 h-10 rounded-none border border-noir-accent/20 flex items-center justify-center group-hover/btn:border-noir-accent group-hover/btn:bg-noir-accent group-hover/btn:text-white transition-colors duration-500">
          <ArrowRight className="w-5 h-5" />
        </div>
      </button>
    </motion.div>
  );
});

export const Services: React.FC = () => {
  const services = React.useMemo(() => [
    { 
      title: 'Ethereal Weddings', 
      desc: 'Bespoke wedding planning for the modern couple. We handle everything from venue scouting to floral design.', 
      icon: <Calendar className="w-10 h-10" />,
      category: 'Celebration'
    },
    { 
      title: 'Garden Soirees',
      desc: 'Intimate celebrations and milestone events designed with a focus on natural beauty and connection.', 
      icon: <Users className="w-10 h-10" />,
      category: 'Social'
    },
    { 
      title: 'Corporate Galas', 
      desc: 'High-production value events for global brands. From refined product launches to international summits.', 
      icon: <Briefcase className="w-10 h-10" />,
      category: 'Business'
    },
    { 
      title: 'Artistic Showcases', 
      desc: 'Immersive experiences that bring your creative vision to life and create lasting impressions.', 
      icon: <Star className="w-10 h-10" />,
      category: 'Marketing'
    },
  ], []);

  return (
    <section id="services" className="py-24 md:py-32 px-6 bg-noir-bg relative overflow-hidden border-y border-noir-border">
      <div className="container mx-auto relative z-10">
        <div className="max-w-5xl mb-24 md:mb-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="inline-flex items-center gap-4 px-8 py-3 rounded-none bg-white border border-noir-border text-noir-accent font-mono text-[10px] uppercase tracking-[0.5em] mb-10 shadow-xl shadow-noir-accent/5"
          >
            <Sparkles className="w-4 h-4 text-noir-accent" />
            Our Expertise
          </motion.div>
          <h2 className="text-2xl md:text-6xl lg:text-7xl font-serif font-semibold text-noir-ink mb-10 tracking-wide leading-[0.85]">
            Curating <br />
            <span className="text-gradient-noir italic font-light">Unforgettable</span> <br />
            Aesthetic Events.
          </h2>
          <p className="text-xl md:text-2xl text-noir-muted leading-relaxed font-light max-w-3xl tracking-normal">
            We provide end-to-end event management services tailored to your unique vision and refined standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-noir-border divide-x divide-noir-border">
          {services.map((service, i) => (
            <div key={service.title}>
              <ExpertiseCard service={service} index={i} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative Background Text */}
      <div className="absolute top-1/2 -right-40 pointer-events-none opacity-[0.02] select-none rotate-90">
        <h2 className="text-[25vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">EXPERTISE</h2>
      </div>
    </section>
  );
};
