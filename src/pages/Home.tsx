import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../sections/Hero';
import { Values } from '../sections/Values';
import { SceneSection } from '../components/experience/SceneSection';
import { ServiceCard } from '../components/ServiceCard';
import { CategoryCard } from '../components/CategoryCard';
import { CATEGORIES } from '../constants';
import { serviceService } from '../services/serviceService';
import { Service } from '../types';

const Portfolio = lazy(() => import('../sections/Portfolio').then((module) => ({ default: module.Portfolio })));
const Gallery = lazy(() => import('../sections/Gallery').then((module) => ({ default: module.Gallery })));

const Home: React.FC = () => {
  const [topRated, setTopRated] = useState<Service[]>([]);
  const [latestArrivals, setLatestArrivals] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadHomeServices = async () => {
      setIsLoading(true);

      try {
        const [ratedServices, recentServices] = await Promise.all([
          serviceService.getServices({ limit: 6, sort: 'rating' }),
          serviceService.getServices({ limit: 4, sort: 'newest' }),
        ]);

        if (mounted) {
          setTopRated(ratedServices.slice(0, 6));
          setLatestArrivals(recentServices.slice(0, 4));
        }
      } catch {
        if (mounted) {
          setTopRated([]);
          setLatestArrivals([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadHomeServices();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredCategories = useMemo(
    () => CATEGORIES.slice(0, 4).map((category) => (
      category.slug === 'videography'
        ? { ...category, image: '/images/videography-western.jpg' }
        : category
    )),
    [],
  );

  const renderSkeletons = (count: number) => (
    Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        data-scene-reveal
        className="h-[34rem] border border-noir-border bg-white/80 skeleton-shimmer"
      />
    ))
  );

  return (
    <main className="bg-noir-bg">
      <Hero />

      <SceneSection className="scene-section--light border-y border-noir-border">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col gap-12 xl:flex-row xl:items-end xl:justify-between">
            <div className="scene-copy">
              <span data-scene-reveal className="scene-kicker">Top Rated Services</span>
              <h2 data-scene-reveal className="scene-title max-w-[11ch]">
                Discover the partners shaping every <span>celebration.</span>
              </h2>
              <p data-scene-reveal className="scene-description">
                Browse live service cards with verified details, pricing, imagery, and booking-ready presentation.
                The marketplace remains fully functional while the earlier cinematic experience stays intact.
              </p>
            </div>

            <div data-scene-reveal className="noir-card max-w-xl">
              <p className="text-[10px] font-semibold text-noir-accent uppercase tracking-[0.4em] mb-6">
                Marketplace Pulse
              </p>
              <p className="text-lg md:text-xl text-noir-muted leading-relaxed font-light mb-8">
                Every listing is designed to surface the most important information first: service quality, category,
                location, and pricing.
              </p>
              <Link to="/events" className="btn-noir w-fit group">
                Explore All Events
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {isLoading ? (
              renderSkeletons(6)
            ) : topRated.length > 0 ? (
              topRated.map((service) => (
                <div key={service._id} data-scene-reveal>
                  <ServiceCard service={service} />
                </div>
              ))
            ) : (
              <div data-scene-reveal className="noir-card md:col-span-2 xl:col-span-3">
                <p className="text-lg text-noir-muted leading-relaxed font-light">
                  No featured services are available yet. Once organizers publish listings, they will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </SceneSection>

      <SceneSection className="scene-section--contrast border-b border-noir-border">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="scene-copy">
              <span data-scene-reveal className="scene-kicker">Category Worlds</span>
              <h2 data-scene-reveal className="scene-title max-w-[12ch]">
                Find the right creative ecosystem for your <span>event.</span>
              </h2>
              <p data-scene-reveal className="scene-description">
                Explore signature categories spanning photography, videography, catering, music, decor, and planning.
                Each card opens directly into the marketplace flow.
              </p>
            </div>

            <div data-scene-reveal>
              <Link to="/explore" className="btn-outline-noir flex items-center gap-4 group !py-5 !px-10">
                View All Categories
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {featuredCategories.map((category, index) => (
              <div
                key={category.id}
                data-scene-reveal
                data-scene-parallax
                className={index % 2 === 1 ? 'md:translate-y-12' : ''}
              >
                <CategoryCard category={category} index={index} />
              </div>
            ))}
          </div>
        </div>
      </SceneSection>

      <SceneSection className="scene-section--light border-b border-noir-border">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col gap-12 xl:flex-row xl:items-end xl:justify-between">
            <div className="scene-copy">
              <span data-scene-reveal className="scene-kicker">Latest Arrivals</span>
              <h2 data-scene-reveal className="scene-title max-w-[12ch]">
                Fresh listings entering the <span>marketplace.</span>
              </h2>
              <p data-scene-reveal className="scene-description">
                New organizers and services are surfaced here first so buyers can spot recent additions without losing the
                polished EVENTO browsing flow.
              </p>
            </div>

            <div data-scene-reveal className="noir-card max-w-md">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-noir-accent/10 border border-noir-accent/20 flex items-center justify-center text-noir-accent shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-noir-accent uppercase tracking-[0.4em] mb-4">Buyer Flow</p>
                  <p className="text-base md:text-lg text-noir-muted leading-relaxed font-light">
                    Service discovery, booking, and payment review remain unchanged. This section only restores the earlier
                    layout and hierarchy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
            {isLoading ? (
              renderSkeletons(4)
            ) : latestArrivals.length > 0 ? (
              latestArrivals.map((service) => (
                <div key={service._id} data-scene-reveal>
                  <ServiceCard service={service} />
                </div>
              ))
            ) : (
              <div data-scene-reveal className="noir-card md:col-span-2 xl:col-span-4">
                <p className="text-lg text-noir-muted leading-relaxed font-light">
                  No recent services are available right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </SceneSection>

      <Values />

      <Suspense fallback={null}>
        <Portfolio />
        <Gallery />
      </Suspense>
    </main>
  );
};

export default Home;
