import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SERVICE_CATEGORIES } from '../constants';
import { ServiceCard } from '../components/ServiceCard';
import { SceneSection } from '../components/experience/SceneSection';
import { serviceService } from '../services/serviceService';
import { Service } from '../types';

const ServicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');

  const categories = useMemo(() => ['All', ...SERVICE_CATEGORIES], []);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || 'All');
    setLocation(searchParams.get('location') || '');
    setSortBy(searchParams.get('sort') || 'newest');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMinRating(searchParams.get('minRating') || '');
  }, [searchParams]);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);

      try {
        const results = await serviceService.getServices({
          search: searchParams.get('search') || searchTerm,
          category: searchParams.get('category') || category,
          location: searchParams.get('location') || location,
          sort: searchParams.get('sort') || sortBy,
          minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
          maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
          minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
        });
        setServices(results);
      } finally {
        setLoading(false);
      }
    };

    void loadServices();
  }, [category, location, searchParams, searchTerm, sortBy]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);

    if (searchTerm.trim()) next.set('search', searchTerm.trim());
    else next.delete('search');

    if (category !== 'All') next.set('category', category);
    else next.delete('category');

    if (location.trim()) next.set('location', location.trim());
    else next.delete('location');

    if (minPrice) next.set('minPrice', minPrice);
    else next.delete('minPrice');

    if (maxPrice) next.set('maxPrice', maxPrice);
    else next.delete('maxPrice');

    if (minRating) next.set('minRating', minRating);
    else next.delete('minRating');

    next.set('sort', sortBy);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('All');
    setLocation('');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSearchParams(new URLSearchParams());
  };

  const activeFilters = [
    searchTerm && `Search: ${searchTerm}`,
    location && `Location: ${location}`,
    category !== 'All' && `Category: ${category}`,
    minPrice && `Min: INR ${minPrice}`,
    maxPrice && `Max: INR ${maxPrice}`,
    minRating && `Rating: ${minRating}+`,
  ].filter(Boolean) as string[];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-noir-bg pt-24">
      <section className="relative overflow-hidden border-b border-noir-border px-6 pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,163,115,0.18),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(27,36,47,0.12),transparent_28%)]" />
        <div className="absolute inset-0 noir-pattern opacity-10" />

        <div className="container relative z-10 mx-auto">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span className="hero-badge inline-flex w-fit items-center gap-3">
                <Sparkles className="h-4 w-4" />
                Curated event marketplace
              </span>
              <h1 className="mt-8 max-w-4xl text-4xl font-display font-semibold uppercase tracking-[0.02em] text-noir-ink md:text-[5.6rem] md:leading-[0.88]">
                Discover the teams behind unforgettable events.
              </h1>
              <p className="mt-6 max-w-2xl text-sm uppercase tracking-wide text-noir-muted md:text-base">
                Explore services with editorial-grade presentation, then filter by city, category, budget, and review score.
              </p>
            </div>

            <div className="scene-note-card border-white/60 bg-white/72">
              <div>
                <span className="scene-kicker">Marketplace status</span>
                <h2 className="mt-3 text-2xl font-display font-semibold uppercase tracking-wide text-noir-ink">
                  {loading ? 'Loading live inventory' : `${services.length} services ready to book`}
                </h2>
              </div>
              <p>
                Search results map directly to live service records, organizer profiles, booking forms, and the UPI payment system.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SceneSection className="scene-section--light">
        <div className="container mx-auto px-6 py-14 md:py-18">
          <form onSubmit={handleSearch} className="marketplace-filter-panel" data-scene-reveal>
            <div className="marketplace-filter-panel__grid">
              <label className="marketplace-input">
                <Search className="h-4 w-4" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search services"
                />
              </label>

              <label className="marketplace-input">
                <MapPin className="h-4 w-4" />
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Location"
                />
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="marketplace-select"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                type="number"
                min="0"
                placeholder="Min price"
                className="marketplace-select"
              />

              <input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                type="number"
                min="0"
                placeholder="Max price"
                className="marketplace-select"
              />

              <select
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                className="marketplace-select"
              >
                <option value="">Any rating</option>
                <option value="4">4+ stars</option>
                <option value="3">3+ stars</option>
                <option value="2">2+ stars</option>
              </select>
            </div>

            <div className="marketplace-filter-panel__actions">
              <div className="flex flex-wrap gap-2">
                {activeFilters.length > 0 ? activeFilters.map((item) => (
                  <span key={item} className="filter-chip">
                    {item}
                  </span>
                )) : (
                  <span className="filter-chip filter-chip--muted">No active filters</span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" data-cursor="GO" className="hero-cta hero-cta--primary">
                  Search services
                </button>
                <button type="button" onClick={clearFilters} className="hero-cta hero-cta--ghost">
                  <X className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </SceneSection>

      <SceneSection className="scene-section--contrast">
        <div className="container mx-auto px-6 pb-24 pt-4 md:pb-32">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div data-scene-reveal>
              <span className="scene-kicker">Result stream</span>
              <h2 className="mt-3 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink md:text-4xl">
                Browse the live service catalog
              </h2>
            </div>

            <div data-scene-reveal className="flex items-center gap-3 self-start border border-noir-border bg-white/72 px-4 py-3 backdrop-blur-md">
              <SlidersHorizontal className="h-4 w-4 text-noir-accent" />
              <select
                value={sortBy}
                onChange={(event) => {
                  const value = event.target.value;
                  setSortBy(value);
                  const next = new URLSearchParams(searchParams);
                  next.set('sort', value);
                  setSearchParams(next);
                }}
                className="bg-transparent text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-ink focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price low</option>
                <option value="price-high">Price high</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="scene-skeleton h-[34rem]" data-scene-reveal />
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <div key={service._id} data-scene-reveal>
                  <ServiceCard service={service} />
                </div>
              ))}
            </div>
          ) : (
            <div className="scene-empty-card" data-scene-reveal>
              No services match the current search. Reset the filters or broaden the query.
            </div>
          )}
        </div>
      </SceneSection>
    </motion.div>
  );
};

export default ServicesPage;
