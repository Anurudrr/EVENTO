import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Camera, Music, Plus, Sparkles, Utensils, Video } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

const iconMap = {
  Camera,
  Video,
  Utensils,
  Music,
  Sparkles,
  Calendar,
} as const;

export const CategoryCard: React.FC<CategoryCardProps> = React.memo(({ category, index = 0 }) => {
  const renderIcon = () => {
    if (typeof category.icon === 'string') {
      const Icon = iconMap[category.icon as keyof typeof iconMap];
      return Icon ? <Icon className="w-6 h-6" /> : null;
    }
    return category.icon;
  };

  return (
    <Link to={`/category/${category.slug}`}>
      <div
        className="relative h-[550px] rounded-[12px] overflow-hidden group cursor-pointer border border-noir-border bg-white shadow-2xl hover:border-noir-accent"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <img
          src={category.image || '/images/placeholder.png'}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/placeholder.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir-bg via-noir-bg/40 to-transparent opacity-80 group-hover:from-noir-accent/95 group-hover:via-noir-accent/35 group-hover:to-transparent" />
        
        <div className="absolute inset-0 p-12 flex flex-col justify-end">
          <div
            className="w-16 h-16 rounded-none bg-noir-accent flex items-center justify-center text-noir-bg mb-8 shadow-2xl shadow-noir-accent/20 group-hover:bg-noir-bg group-hover:text-noir-accent group-hover:border group-hover:border-noir-accent/30"
          >
            {renderIcon()}
          </div>
          <h3 className="text-xl md:text-2xl font-display font-medium text-noir-ink mb-4 tracking-wide uppercase leading-snug group-hover:text-white">
            {category.name}
          </h3>
          <p className="text-noir-muted text-base md:text-lg font-light line-clamp-2 opacity-100 uppercase tracking-normal group-hover:text-white/85">
            {category.description}
          </p>
          
          <div className="mt-8 flex items-center gap-4 text-noir-accent font-medium text-[10px] uppercase tracking-[0.4em] opacity-100 group-hover:text-white">
            Explore Now
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
        
        {/* Decorative Overlay */}
        <div className="absolute top-8 right-8 w-14 h-14 border border-noir-border rounded-none flex items-center justify-center opacity-100 group-hover:border-white/40 group-hover:bg-white/10">
          <Plus className="w-7 h-7 text-noir-ink group-hover:text-white" />
        </div>
      </div>
    </Link>
  );
});
