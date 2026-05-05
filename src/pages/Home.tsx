import React, { Suspense, lazy, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../sections/Hero';
import { Values } from '../sections/Values';
import { SceneSection } from '../components/experience/SceneSection';
import { ServiceCard } from '../components/ServiceCard';
import { CategoryCard } from '../components/CategoryCard';
import { Seo } from '../components/Seo';
import { CATEGORIES } from '../constants';
import { serviceService } from '../services/serviceService';
import { Service } from '../types';
import { useNearViewport } from '../hooks/useNearViewport';

const Portfolio = lazy(() => import('../sections/Portfolio').then((module) => ({ default: module.Portfolio })));
const Gallery = lazy(() => import('../sections/Gallery').then((module) => ({ default: module.Gallery })));
const EventoMap = lazy(() => import('../components/EventoMap').then((module) => ({ default: module.EventoMap })));

const Home: React.FC = () => {
  const [topRated, setTopRated] = useState<Service[]>([]);
  const [latestArrivals, setLatestArrivals] = useState<Service[]>([]);
  const [mapServices, setMapServices] = useState<Service[]>([]);
  const [mapError, setMapError] = useState('');
  const [servicesLoading, setServicesLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [hasRequestedMap, setHasRequestedMap] = useState(false);
  const deferredMapServices = useDeferredValue(mapServices);
  const { ref: mapSectionRef, isNearViewport: shouldLoadMapSection } = useNearViewport<HTMLElement>('480px');

  useEffect(() => {
    let mounted = true;

    const loadHomeServices = async () => {
      setServicesLoading(true);

      try {
        const [ratedResult, recentResult] = await Promise.allSettled([
          serviceService.getServices({ limit: 6, sort: 'rating' }),
          serviceService.getServices({ limit: 4, sort: 'newest' }),
        ]);

        if (mounted) {
          setTopRated(ratedResult.status === 'fulfilled' ? ratedResult.value.slice(0, 6) : []);
          setLatestArrivals(recentResult.status === 'fulfilled' ? recentResult.value.slice(0, 4) : []);
        }
      } finally {
        if (mounted) {
          setServicesLoading(false);
        }
      }
    };

    void loadHomeServices();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldLoadMapSection || hasRequestedMap) {
      return undefined;
    }

    let mounted = true;
    setHasRequestedMap(true);
    setMapLoading(true);
    setMapError('');

    const loadMapServices = async () => {
      try {
        const result = await serviceService.getMappedServices();
        if (mounted) {
          setMapServices(result);
        }
      } catch {
        if (mounted) {
          setMapError('Live location markers are temporarily unavailable.');
          setMapServices([]);
        }
      } finally {
        if (mounted) {
          setMapLoading(false);
        }
      }
    };

    void loadMapServices();

    return () => {
      mounted = false;
    };
  }, [hasRequestedMap, shouldLoadMapSection]);

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
      <Seo
        title="Premium Event Services Marketplace"
        description="Discover photographers, planners, decorators, caterers, and other premium event professionals on EVENTO."
        path="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'EVENTO',
          url: typeof window === 'undefined' ? '/' : window.location.origin,
        }}
      />
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
                Browse live service cards with organizer verification status, pricing, imagery, and booking-ready presentation.
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
            {servicesLoading ? (
              renderSkeletons(6)
            ) : topRated.length > 0 ? (
              topRated.map((service) => (
                <div key={service._id} data-scene-reveal>
                  <ServiceCard service={service} withEntryAnimation={false} />
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
            {servicesLoading ? (
              renderSkeletons(4)
            ) : latestArrivals.length > 0 ? (
              latestArrivals.map((service) => (
                <div key={service._id} data-scene-reveal>
                  <ServiceCard service={service} withEntryAnimation={false} />
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

      <SceneSection className="scene-section--contrast border-b border-noir-border">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div ref={mapSectionRef} className="flex flex-col gap-12 xl:flex-row xl:items-end xl:justify-between">
            <div className="scene-copy">
              <span data-scene-reveal className="scene-kicker">OpenStreetMap Venue View</span>
              <h2 data-scene-reveal className="scene-title max-w-[13ch]">
                Track mapped event locations across the <span>marketplace.</span>
              </h2>
              <p data-scene-reveal className="scene-description">
                Public venue pins render from organizer submissions, so visitors can inspect exact coordinates before opening a listing.
              </p>
            </div>

            <div data-scene-reveal className="noir-card max-w-xl">
              <p className="text-[10px] font-semibold text-noir-accent uppercase tracking-[0.4em] mb-6">
                Live marker stream
              </p>
              <p className="text-lg md:text-xl text-noir-muted leading-relaxed font-light">
                Popups expose each event title, date metadata, and location without adding any paid map dependency.
              </p>
            </div>
          </div>

          <div className="mt-16" data-scene-reveal>
            {shouldLoadMapSection ? (
              <Suspense fallback={<div className="h-[520px] border border-noir-border bg-white/80 skeleton-shimmer" />}>
                <EventoMap
                  events={deferredMapServices}
                  loading={mapLoading}
                  error={mapError}
                  emptyMessage="Event locations will appear here once organizers publish mapped venues."
                  height={520}
                />
              </Suspense>
            ) : (
              <div className="h-[520px] border border-noir-border bg-white/80 skeleton-shimmer" />
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
