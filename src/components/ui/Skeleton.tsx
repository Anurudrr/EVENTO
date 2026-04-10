import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  return (
    <div
      className={cn(
        'skeleton-shimmer relative overflow-hidden border border-noir-border bg-noir-card',
        variant === 'rectangular' && 'rounded-none',
        variant === 'circular' && 'rounded-none',
        variant === 'text' && 'rounded-none h-4 w-full',
        className
      )}
      {...props}
    />
  );
};
