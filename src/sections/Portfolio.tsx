import React from 'react';
import { ArrowUpRight, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Portfolio: React.FC = () => {
  const projects = React.useMemo(() => [
    { 
      title: 'The Ethereal Wedding', 
      category: 'Celebration', 
      img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200',
      location: 'Tuscany, Italy',
      year: '2024'
    },
    { 
      title: 'Floral Garden Gala', 
      category: 'Social', 
      img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
      location: 'Provence, France',
      year: '2024'
    },
    { 
      title: 'Artistic Bloom Expo', 
      category: 'Exhibition', 
      img: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=1200',
      location: 'Kyoto, Japan',
      year: '2023'
    },
    { 
      title: 'Parisian Spring Soirée', 
      category: 'Social', 
      img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
      location: 'Paris, France',
      year: '2023'
    },
    { 
      title: 'Midnight Jazz Lounge', 
      category: 'Music', 
      img: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=1200',
      location: 'New Orleans, USA',
      year: '2023'
    },
    { 
      title: 'Tech Summit 2024', 
      category: 'Corporate', 
      img: 'https://images.unsplash.com/photo-1540575861501-7ad05823c951?auto=format&fit=crop&q=80&w=1200',
      location: 'San Francisco, USA',
      year: '2024'
    },
  ], []);

  return (
    <section id="portfolio" className="py-24 md:py-32 px-6 bg-noir-bg relative overflow-hidden border-b border-noir-border">
      <div className="absolute top-0 left-0 w-full h-full noir-pattern pointer-events-none opacity-20" />
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 md:mb-32 gap-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-4 px-8 py-3 rounded-none bg-white border border-noir-border text-noir-accent font-mono text-[10px] uppercase tracking-[0.5em] mb-10 shadow-xl shadow-noir-accent/5">
              <Sparkles className="w-4 h-4 text-noir-accent" />
              Our Portfolio
            </div>
            <h2 className="text-2xl md:text-[7rem] font-serif font-semibold text-noir-ink tracking-wide leading-[0.8]">
              Selected works that <br />
              <span className="text-gradient-noir italic font-light">Define Grace.</span>
            </h2>
          </div>
          <div className="w-full md:w-auto">
            <Link to="/portfolio" className="btn-outline-noir flex items-center gap-4 w-full md:w-auto justify-center group !py-5 !px-10">
              View All Projects
              <ArrowUpRight className="w-6 h-6 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {projects.map((project, i) => (
            <div 
              key={i}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/10] rounded-none overflow-hidden mb-8 border border-noir-border shadow-[0_60px_120px_-30px_rgba(212,163,115,0.1)]">
                <img 
                  src={project.img} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute top-12 right-12">
                  <div className="w-20 h-20 rounded-none bg-noir-accent flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-2xl">
                    <ArrowUpRight className="w-10 h-10" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start px-4">
                <div>
                  <div className="flex items-center gap-6 mb-4">
                    <span className="text-[10px] font-semibold text-noir-accent uppercase tracking-[0.4em]">{project.category}</span>
                    <span className="w-2 h-2 bg-noir-accent/30 rounded-none rotate-45" />
                    <div className="flex items-center gap-3 text-noir-muted text-sm font-medium uppercase tracking-widest">
                      <MapPin className="w-5 h-5" />
                      {project.location}
                    </div>
                  </div>
                  <h3 className="text-xl md:text-3xl font-serif font-semibold text-noir-ink group-hover:text-noir-accent transition-colors duration-300 tracking-wide leading-snug">
                    {project.title}
                  </h3>
                </div>
                <span className="text-noir-accent/40 font-mono text-2xl">{project.year}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative Background Text */}
      <div className="absolute -bottom-40 -right-40 pointer-events-none opacity-[0.02] select-none">
        <h2 className="text-[30vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">PORTFOLIO</h2>
      </div>
    </section>
  );
};
