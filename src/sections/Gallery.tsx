import React from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { FALLBACK_IMAGE_URL } from '../utils';

export const Gallery: React.FC = () => {
  const images = [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1504150559433-c4a5c0d802df?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=800',
  ];

  return (
    <section id="gallery" className="py-24 md:py-32 px-6 bg-noir-bg overflow-hidden relative border-b border-noir-border">
      <div className="absolute inset-0 noir-pattern pointer-events-none opacity-20" />
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-4 px-8 py-3 rounded-none bg-white border border-noir-border text-noir-accent font-mono text-[10px] uppercase tracking-[0.5em] mb-6 shadow-2xl shadow-noir-accent/5">
            <Sparkles className="w-4 h-4 text-noir-accent" />
            Visual Showcase
          </div>
          <h2 className="text-2xl md:text-[6rem] font-serif font-semibold text-noir-ink tracking-wide leading-[0.9]">
            Capturing the <br />
            <span className="text-gradient-noir italic font-serif font-light">Ethereal Moments.</span>
          </h2>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-0 border border-noir-border divide-x divide-noir-border">
          {images.map((img, i) => (
            <div 
              key={i}
              className="relative group cursor-pointer rounded-none overflow-hidden border border-noir-border shadow-2xl break-inside-avoid mb-0 hover-float"
            >
              <img 
                src={img} 
                alt={`Gallery ${i}`}
                className="w-full h-auto object-cover image-safe"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-24 h-24 rounded-none bg-noir-accent flex items-center justify-center text-white shadow-2xl border border-noir-border">
                  <Maximize2 className="w-10 h-10" />
                </div>
              </div>
              
              <div className="absolute bottom-12 left-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-none shadow-2xl border border-noir-border">
                  <Sparkles className="w-6 h-6 text-noir-accent" />
                  <span className="text-[10px] font-semibold text-noir-ink uppercase tracking-[0.4em]">View Moment</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative Background Text */}
      <div className="absolute -top-40 -left-40 pointer-events-none opacity-[0.03] select-none">
        <h2 className="text-[30vw] font-serif font-semibold text-noir-accent leading-snug tracking-wide">GALLERY</h2>
      </div>
    </section>
  );
};
