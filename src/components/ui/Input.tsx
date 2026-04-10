import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  className,
  label,
  error,
  icon,
  ...props
}) => {
  return (
    <div className="space-y-3 w-full">
      {label && (
        <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em] ml-4 block">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-noir-accent/20 group-focus-within:text-noir-accent transition-colors">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full bg-noir-bg border border-noir-border rounded-none py-5 text-noir-ink font-mono font-semibold uppercase tracking-widest text-lg placeholder:text-noir-muted/30 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all shadow-2xl',
            icon ? 'pl-16 pr-8' : 'px-8',
            error ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-rose-500 text-[10px] font-mono font-semibold uppercase tracking-widest ml-4 animate-in fade-in slide-in-from-left-2">
          {error}
        </p>
      )}
    </div>
  );
};
