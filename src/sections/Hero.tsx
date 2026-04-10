import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CinematicHeroCanvas } from '../components/experience/CinematicHeroCanvas';
import { HeroEditorialImage } from '../components/hero/HeroEditorialImage';
import { HeroJourneyCard } from '../components/hero/HeroJourneyCard';
import { HeroSearchBar } from '../components/hero/HeroSearchBar';
import { useAnimation } from '../animations/AnimationProvider';

gsap.registerPlugin(ScrollTrigger);

export const Hero: React.FC = () => {
  const rootRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const { isReducedMotion } = useAnimation();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Anywhere');

  useEffect(() => {
    if (!rootRef.current || isReducedMotion) {
      return undefined;
    }

    const sectionElement = rootRef.current;
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

      gsap.set('[data-hero-line]', { yPercent: 110, opacity: 0 });

      timeline
        .from('[data-hero-kicker]', { opacity: 0, y: 20, duration: 0.45 })
        .to('[data-hero-line]', { yPercent: 0, opacity: 1, duration: 0.95, stagger: 0.09 }, '-=0.1')
        .from('[data-hero-copy]', { opacity: 0, y: 24, duration: 0.6 }, '-=0.42')
        .from('[data-hero-search]', { opacity: 0, y: 22, duration: 0.55 }, '-=0.35')
        .from('[data-hero-actions]', { opacity: 0, y: 20, duration: 0.55 }, '-=0.32')
        .from('[data-hero-card]', { opacity: 0, y: 32, scale: 0.98, duration: 0.78 }, '-=0.45')
        .from('[data-hero-card-item]', { opacity: 0, y: 14, duration: 0.38, stagger: 0.08 }, '-=0.38');

      // Keep the hero feeling layered while still respecting the current scroll system.
      gsap.to('[data-hero-parallax="content"]', {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionElement,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.7,
        },
      });

      gsap.to('[data-hero-parallax="card"]', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionElement,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.9,
        },
      });

      gsap.to('[data-hero-float]', {
        y: -14,
        duration: 5.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, [isReducedMotion]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    // Route into the existing /events filters so the hero acts like a real product surface.
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set('search', query.trim());
    }

    if (location !== 'Anywhere') {
      params.set('location', location);
    }

    navigate(params.toString() ? `/events?${params.toString()}` : '/events');
  };

  return (
    <section ref={rootRef} className="hero-stage min-h-screen">
      <div className="hero-stage__canvas" data-hero-parallax="canvas">
        <CinematicHeroCanvas />
      </div>
      <div className="hero-stage__backdrop" />
      <div className="hero-stage__grain" />

      <div className="container relative z-10 mx-auto px-6 pt-28 pb-20 md:pt-32 md:pb-24">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] lg:items-center">
          <div data-hero-parallax="content" className="max-w-[44rem]">
            <div data-hero-kicker className="hero-kicker inline-flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-noir-accent" />
              EVENTO Curated Marketplace
            </div>

            <h1 className="hero-headline mt-8">
              <span className="hero-headline__line overflow-hidden">
                <span data-hero-line className="block">
                  Grace in the
                </span>
              </span>
              <span className="hero-headline__line overflow-hidden">
                <span data-hero-line className="hero-headline__accent block">
                  Extraordinary
                </span>
              </span>
            </h1>

            <p data-hero-copy className="hero-copy mt-8">
              Search premium photographers, venues, decorators, and planners in one elevated booking flow.
            </p>

            <form onSubmit={handleSearch} className="mt-10 space-y-5">
              <HeroSearchBar
                query={query}
                location={location}
                onQueryChange={setQuery}
                onLocationChange={setLocation}
              />

              <div data-hero-actions className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  data-cursor="GO"
                  className="hero-cta hero-stage__action hero-stage__action--primary group"
                >
                  Search Services
                  <ArrowRight className="hero-stage__action-icon h-5 w-5" />
                </button>
                <Link
                  to="/explore"
                  data-cursor="OPEN"
                  className="hero-cta hero-stage__action hero-stage__action--ghost group"
                >
                  Browse Categories
                  <ArrowRight className="hero-stage__action-icon h-5 w-5" />
                </Link>
              </div>
            </form>
          </div>

          <div data-hero-card data-hero-parallax="card" className="lg:justify-self-end lg:w-full lg:max-w-[34rem]">
            <div className="relative mx-auto w-full max-w-[31rem] lg:mx-0 lg:pb-20">
              <HeroEditorialImage />

              <div className="relative z-20 mx-auto mt-14 w-full max-w-[21rem] sm:mt-16 lg:absolute lg:-bottom-2 lg:right-0 lg:mt-0 lg:mx-0 xl:-right-8">
                <HeroJourneyCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
