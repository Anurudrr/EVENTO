import React, { useState } from 'react';
import { Search, MapPin, Sparkles, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const SearchBar: React.FC = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (searchValue.trim()) params.set('search', searchValue.trim());
    if (locationValue.trim()) params.set('location', locationValue.trim());

    navigate(`/events${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleQuickTag = (tag: string) => {
    setSearchValue(tag);
    const params = new URLSearchParams();
    params.set('search', tag);
    navigate(`/events?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group max-w-5xl mx-auto transition-all duration-500 ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r from-noir-accent/20 via-noir-accent/5 to-noir-accent/20 rounded-none blur-2xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
      
      <form onSubmit={handleSubmit} className={`relative bg-noir-card/80 backdrop-blur-2xl p-4 md:p-6 rounded-none shadow-2xl border transition-all duration-500 flex flex-col md:flex-row items-center gap-4 md:gap-8 ${isFocused ? 'border-noir-accent' : 'border-noir-border'}`}>
        
        {/* Search Input */}
        <div className="flex-grow flex items-center gap-6 px-4 py-3 md:py-0 w-full group/input">
          <div className={`w-14 h-14 rounded-none flex items-center justify-center transition-all duration-500 border border-noir-border shadow-2xl ${isFocused ? 'bg-noir-accent text-noir-bg rotate-12' : 'bg-noir-bg text-noir-accent'}`}>
            <Search className="w-7 h-7" />
          </div>
          <div className="flex-grow relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="What service are you looking for?"
              className="w-full bg-transparent border-none focus:ring-0 text-noir-ink placeholder:text-noir-muted/30 font-display font-semibold text-xl md:text-2xl tracking-wide py-2 uppercase"
            />
            <AnimatePresence>
              {searchValue && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchValue('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-noir-muted/30 hover:text-noir-accent transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Divider */}
        <div className="hidden md:block w-px h-16 bg-noir-border" />
        
        {/* Location Input */}
        <div className="flex-grow flex items-center gap-6 px-4 py-3 md:py-0 w-full group/input">
          <div className={`w-14 h-14 rounded-none flex items-center justify-center transition-all duration-500 border border-noir-border shadow-2xl ${isFocused ? 'bg-noir-accent text-noir-bg' : 'bg-noir-bg text-noir-accent'}`}>
            <MapPin className="w-7 h-7" />
          </div>
          <div className="flex-grow relative">
            <input
              type="text"
              value={locationValue}
              onChange={(e) => setLocationValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Location"
              className="w-full bg-transparent border-none focus:ring-0 text-noir-ink placeholder:text-noir-muted/30 font-display font-semibold text-xl md:text-2xl tracking-wide py-2 uppercase"
            />
            <AnimatePresence>
              {locationValue && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setLocationValue('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-noir-muted/30 hover:text-noir-accent transition-colors"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Search Button */}
        <button type="submit" className="btn-noir w-full md:w-auto !px-16 !py-6 !rounded-none flex items-center justify-center gap-4 group/btn overflow-hidden relative shadow-2xl shadow-noir-accent/20">
          <span className="relative z-10 text-lg font-display font-semibold tracking-widest uppercase">Search</span>
          <ArrowRight className="w-6 h-6 relative z-10 group-hover/btn:translate-x-2 transition-transform" />
        </button>
      </form>

      {/* Quick Suggestions */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 w-full mt-6 flex flex-wrap gap-4 justify-center"
          >
            {['Photography', 'Music', 'Weddings', 'Corporate', 'Festivals'].map((tag) => (
              <button
                key={tag}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleQuickTag(tag)}
                className="px-8 py-3 rounded-none bg-noir-card/80 backdrop-blur-md border border-noir-border text-noir-accent text-[10px] font-mono font-semibold uppercase tracking-[0.4em] hover:bg-noir-accent hover:text-noir-bg hover:border-noir-accent transition-all duration-300 shadow-2xl"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
