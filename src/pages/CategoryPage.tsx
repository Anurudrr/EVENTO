import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, Loader2, Sparkles, Star, ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard';
import { serviceService } from '../services/serviceService';
import { Service } from '../types';
import { CATEGORIES } from '../constants';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = useMemo(() => CATEGORIES.find(c => c.slug === slug), [slug]);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [location, setLocation] = useState('All Locations');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      if (!category) return;
      try {
        setLoading(true);
        const data = await serviceService.getServices({ 
          category: category.name,
          sort: sortBy === 'price_low' ? 'price-low' : sortBy === 'price_high' ? 'price-high' : sortBy === 'rating' ? 'rating' : 'newest',
          location: location === 'All Locations' ? undefined : location,
          minRating: minRating || undefined,
          maxPrice,
          page,
          limit: 6,
        });
        setServices((prev) => page === 1 ? data : [...prev, ...data]);
        setHasMore(data.length === 6);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [category, sortBy, location, minRating, maxPrice, page]);

  useEffect(() => {
    setPage(1);
  }, [sortBy, location, minRating, maxPrice, slug]);

  if (!category) return (
    <div className="pt-40 text-center min-h-screen bg-noir-bg">
      <h2 className="text-2xl font-display font-semibold text-noir-ink mb-10 uppercase tracking-wide">Category not found</h2>
      <Link to="/explore" className="btn-noir !py-4 !px-10">Back to Explore</Link>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-noir-bg min-h-screen"
    >
      {/* Category Hero */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden border-b border-noir-border">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={category.image || '/images/placeholder.png'}
          alt={category.name}
          className="w-full h-full object-cover"
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-noir-bg/40 via-noir-bg/80 to-noir-bg" />
        
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div className="max-w-7xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-none bg-noir-accent/10 backdrop-blur-md border border-noir-accent/20 text-noir-accent text-[10px] font-mono font-semibold uppercase tracking-[0.5em] mb-12 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              Category Showcase
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-6xl md:text-[10rem] font-display font-semibold text-noir-ink mb-12 tracking-wide leading-[0.8] uppercase"
            >
              {category.name?.split(' ')[0] || ''} <span className="text-gradient-noir italic font-sans font-light">{category.name?.split(' ').slice(1).join(' ') || ''}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl md:text-xl text-noir-muted max-w-4xl mx-auto font-light leading-relaxed uppercase tracking-normal"
            >
              {category.description}
            </motion.p>
          </div>
        </div>

        {/* Back Button */}
        <Link 
          to="/explore"
          className="absolute top-40 left-8 md:left-12 flex items-center gap-4 text-noir-muted hover:text-noir-accent transition-colors group z-20"
        >
          <div className="w-12 h-12 rounded-none bg-noir-bg/80 backdrop-blur-md border border-noir-border flex items-center justify-center group-hover:bg-noir-accent group-hover:text-noir-bg transition-all">
            <ArrowLeft className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em]">Explore</span>
        </Link>
      </div>

      <div className="container mx-auto px-6 -mt-24 relative z-10 pb-40">
        <div className="flex flex-col lg:flex-row gap-20">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-96 space-y-10">
            <div className="bg-noir-card p-12 rounded-none border border-noir-border shadow-2xl sticky top-40">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-display font-semibold text-noir-ink tracking-wide uppercase">Filters</h3>
                <div className="w-12 h-12 rounded-none bg-noir-accent/10 border border-noir-border flex items-center justify-center text-noir-accent">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <h4 className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-[0.3em] mb-8">Price Range</h4>
                  <div className="space-y-6">
                    <input 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      min={0}
                      max={5000}
                      type="range" 
                      className="w-full h-1 bg-noir-border rounded-none appearance-none accent-noir-accent cursor-pointer" 
                    />
                    <div className="flex justify-between text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-widest">
                      <span>INR 0</span>
                      <span>INR {maxPrice}+</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-[0.3em] mb-8">Rating</h4>
                  <div className="space-y-5">
                    {[5, 4, 3].map(star => (
                      <label key={star} className="flex items-center gap-5 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={minRating === star}
                            onChange={() => setMinRating(minRating === star ? 0 : star)}
                            className="peer appearance-none w-7 h-7 rounded-none border border-noir-border checked:bg-noir-accent checked:border-noir-accent transition-all cursor-pointer"
                          />
                          <div className="absolute opacity-0 peer-checked:opacity-100 text-noir-bg pointer-events-none transition-opacity">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-noir-muted font-mono text-xs uppercase tracking-widest group-hover:text-noir-accent transition-colors flex items-center gap-3">
                          {star} Stars & Above
                          <Star className="w-4 h-4 text-noir-accent fill-noir-accent" />
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-[0.3em] mb-8">Location</h4>
                  <div className="relative">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-noir-bg border border-noir-border rounded-none px-8 py-5 text-noir-ink font-mono text-xs uppercase tracking-widest focus:outline-none focus:border-noir-accent appearance-none cursor-pointer"
                    >
                      <option>All Locations</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>Bangalore</option>
                    </select>
                    <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-noir-accent pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSortBy('newest');
                  setLocation('All Locations');
                  setMinRating(0);
                  setMaxPrice(5000);
                  setPage(1);
                }}
                className="w-full btn-noir mt-16 !py-5 text-xs uppercase tracking-[0.2em]"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Service List */}
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
              <div>
                <h3 className="text-xl font-display font-semibold text-noir-ink tracking-wide mb-3 uppercase">Available Services</h3>
                <p className="text-noir-muted font-mono text-xs uppercase tracking-widest">Showing <span className="text-noir-accent font-semibold">{services.length}</span> premium services in {category.name}</p>
              </div>
              
              <div className="flex items-center gap-8 w-full md:w-auto">
                <div className="flex items-center gap-5 flex-grow md:flex-grow-0">
                  <span className="text-[10px] font-mono font-semibold text-noir-muted uppercase tracking-widest whitespace-nowrap">Sort by:</span>
                  <div className="relative flex-grow md:flex-grow-0">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-noir-card border border-noir-border rounded-none px-10 py-4 pr-16 text-noir-ink font-mono font-semibold text-xs uppercase tracking-widest focus:outline-none focus:border-noir-accent cursor-pointer shadow-sm w-full"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                      <option value="rating">Rating</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-noir-accent pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-40 gap-8"
                >
                  <div className="relative">
                    <Loader2 className="w-20 h-20 text-noir-accent animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-noir-accent animate-pulse" />
                  </div>
                  <p className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.5em] animate-pulse">Curating Services...</p>
                </motion.div>
              ) : services.length > 0 ? (
                <motion.div 
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16"
                >
                  {services.map((service, index) => (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index % 6) }}
                    >
                      <ServiceCard service={service} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-40 bg-noir-card rounded-none border border-dashed border-noir-border shadow-2xl"
                >
                  <div className="w-32 h-32 bg-noir-accent/5 rounded-none border border-noir-border flex items-center justify-center text-noir-accent/20 mx-auto mb-10">
                    <SearchIcon className="w-16 h-16" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-noir-ink mb-6 tracking-wide uppercase">No services found</h3>
                  <p className="text-noir-muted text-xl font-light mb-12 max-w-xl mx-auto uppercase tracking-normal">We couldn't find any services matching your criteria in this category.</p>
                  <button 
                    onClick={() => {
                      setSortBy('newest');
                      setLocation('All Locations');
                      setMinRating(0);
                      setMaxPrice(5000);
                      setPage(1);
                    }}
                    className="btn-outline-noir !py-5 !px-12 text-xs uppercase tracking-widest"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {!loading && services.length > 0 && hasMore && (
              <div className="mt-32 flex justify-center">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  className="btn-outline-noir !py-5 !px-16 text-xs uppercase tracking-widest !rounded-none group"
                >
                  Load More Services
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-2 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryPage;
