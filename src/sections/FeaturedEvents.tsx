import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServiceCard } from '../components/ServiceCard';
import { serviceService } from '../services/serviceService';
import { Service } from '../types';

interface FeaturedEventsProps {
  title: string;
  subtitle: string;
  filter?: (service: Service) => boolean;
  limit?: number;
  offset?: number;
}

let featuredEventsCache: Service[] | null = null;
let featuredEventsPromise: Promise<Service[]> | null = null;

export const FeaturedEvents: React.FC<FeaturedEventsProps> = React.memo(({ 
  title, 
  subtitle, 
  filter, 
  limit = 3,
  offset = 0,
}) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        if (!featuredEventsPromise) {
          featuredEventsPromise = serviceService.getServices({ limit: 12, sort: 'newest' });
        }

        const data = featuredEventsCache ?? await featuredEventsPromise;
        featuredEventsCache = data;
        if (mounted) {
          setServices(data);
        }
      } catch {
        if (mounted) {
          setServices([]);
        }
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  const displayServices = useMemo(() => {
    const filteredServices = filter ? services.filter(filter) : services;
    return filteredServices.slice(offset, offset + limit);
  }, [filter, limit, offset, services]);

  if (displayServices.length === 0) {
    return null;
  }

  return (
    <section className="py-24 md:py-32 px-6 bg-noir-bg relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 md:mb-24 gap-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-4 px-8 py-3 rounded-none bg-white border border-noir-border text-noir-accent font-mono text-[10px] uppercase tracking-[0.5em] mb-10 shadow-xl shadow-noir-accent/5">
              <Sparkles className="w-4 h-4 text-noir-accent" />
              {subtitle}
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-serif font-medium text-noir-ink tracking-wide leading-[0.95] uppercase">
              {title?.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {i === title?.split(' ').length - 1 ? (
                    <span className="text-gradient-noir italic font-light">{word}</span>
                  ) : (
                    <>{word} </>
                  )}
                </React.Fragment>
              ))}
            </h2>
          </div>
          <div>
            <Link to="/events" className="btn-outline-noir flex items-center gap-4 group !py-5 !px-10">
              Explore All Events
              <ArrowRight className="w-5 h-5 group-hover:translate-x-4 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
          {displayServices.map((service) => (
            <ServiceCard key={service._id} service={service} />
          ))}
        </div>
      </div>
      
      {/* Decorative Background Text */}
      <div className="absolute top-1/2 -right-40 pointer-events-none opacity-[0.02] select-none rotate-90">
        <h2 className="text-[25vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">{subtitle?.split(' ')[0] || ''}</h2>
      </div>
    </section>
  );
});
