import React from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { GALLERY_IMAGE_PATHS } from '../constants/images';
import { FALLBACK_IMAGE_URL } from '../utils';

const GALLERY_LABELS = [
  'Decor',
  'Photography',
  'Planning',
  'Videography',
  'Catering',
  'Music',
  'Wedding Film',
  'Portraits',
  'Installations',
] as const;

export const Gallery: React.FC = React.memo(() => {
  return (
    <section id="gallery" className="py-24 md:py-32 px-6 bg-noir-bg overflow-hidden relative border-b border-noir-border">
      <div className="absolute inset-0 noir-pattern pointer-events-none opacity-15" />
      <div className="container mx-auto relative z-10">
        <div className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <div className="inline-flex items-center gap-4 rounded-full bg-white px-7 py-3 text-noir-accent font-mono text-[10px] uppercase tracking-[0.32em] mb-6 shadow-xl shadow-noir-blue/5 border border-noir-border">
            <Sparkles className="w-4 h-4 text-noir-accent" />
            Visual Showcase
          </div>
          <h2 className="text-4xl md:text-6xl font-serif font-semibold text-noir-ink leading-tight">
            Real event details across every service category.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-noir-muted">
            A balanced view of decor, food, music, planning, photography, and film so the site feels useful beyond one event style.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY_IMAGE_PATHS.map((imagePath, index) => (
            <div
              key={`${imagePath}-${index}`}
              className={`relative group cursor-pointer overflow-hidden rounded-[8px] border border-noir-border bg-white shadow-xl shadow-noir-blue/5 hover-float ${
                index === 0 || index === 5 ? 'lg:row-span-2' : ''
              }`}
            >
              <img
                src={imagePath}
                alt={`${GALLERY_LABELS[index] || 'Event'} gallery`}
                className={`w-full object-cover image-safe transition-transform duration-500 group-hover:scale-105 ${
                  index === 0 || index === 5 ? 'h-[34rem]' : 'h-72'
                }`}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-ink/70 via-noir-ink/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-85" />

              <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                <Maximize2 className="w-5 h-5" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-semibold text-white/72 uppercase tracking-[0.28em]">Moment</span>
                    <p className="mt-2 text-2xl font-serif font-semibold text-white">{GALLERY_LABELS[index] || 'Event'}</p>
                  </div>
                  <span className="rounded-full bg-white/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-noir-ink">
                    View
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
