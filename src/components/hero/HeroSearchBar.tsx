import React from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';

const LOCATION_OPTIONS = [
  'Anywhere',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Goa',
  'Vadodara',
] as const;

interface HeroSearchBarProps {
  query: string;
  location: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

export const HeroSearchBar: React.FC<HeroSearchBarProps> = React.memo(({
  query,
  location,
  onQueryChange,
  onLocationChange,
}) => {
  return (
    <div
      data-hero-search
      className="grid gap-3 rounded-[30px] border border-black/8 bg-[rgba(250,245,237,0.58)] p-3 shadow-[0_24px_90px_rgba(95,67,39,0.12)] backdrop-blur-[24px] md:grid-cols-[minmax(0,1fr)_220px]"
    >
      <label className="flex items-center gap-3 rounded-[22px] border border-black/8 bg-white/56 px-5 py-4 text-noir-muted transition-colors duration-300 focus-within:border-noir-accent/38 focus-within:text-noir-ink">
        <Search className="h-5 w-5 shrink-0 text-noir-accent" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search photographers, venues, decorators..."
          className="w-full bg-transparent text-base text-noir-ink placeholder:text-noir-muted/55 focus:outline-none"
          autoComplete="off"
          aria-label="Search services"
        />
      </label>

      <label className="relative flex items-center gap-3 rounded-[22px] border border-black/8 bg-white/56 px-5 py-4 text-noir-muted transition-colors duration-300 focus-within:border-noir-accent/38 focus-within:text-noir-ink">
        <MapPin className="h-5 w-5 shrink-0 text-noir-accent" />
        <select
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          className="w-full appearance-none bg-transparent pr-8 text-base text-noir-ink focus:outline-none"
          aria-label="Select location"
        >
          {LOCATION_OPTIONS.map((option) => (
            <option key={option} value={option} className="bg-[#f3eadf] text-[#2f2419]">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-noir-muted/70" />
      </label>
    </div>
  );
});
