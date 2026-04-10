import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "onDrag" | "children"> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-noir-ink text-noir-bg hover:bg-noir-accent hover:text-noir-bg shadow-xl shadow-noir-accent/5',
    secondary: 'bg-noir-card text-noir-ink hover:bg-noir-ink hover:text-noir-bg border border-noir-border',
    outline: 'border border-noir-border text-noir-ink hover:border-noir-accent hover:text-noir-accent',
    ghost: 'text-noir-muted hover:text-noir-ink hover:bg-white/5',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs tracking-widest',
    md: 'px-8 py-4 text-sm tracking-widest',
    lg: 'px-12 py-6 text-base tracking-widest',
    icon: 'p-4',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-none font-display uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}

      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.button>
  );
};
