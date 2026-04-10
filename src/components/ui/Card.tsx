import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends Omit<HTMLMotionProps<"div">, "onDrag" | "children"> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverEffect = true,
  children,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hoverEffect ? {
        y: -8,
        scale: 1.03,
        boxShadow: '0 28px 72px rgba(0, 0, 0, 0.14)',
      } : {}}
      transition={{ duration: 0.26, ease: 'easeOut' }}
      className={cn(
        'bg-noir-card border border-noir-border rounded-none shadow-2xl overflow-hidden group',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-8 border-b border-noir-border', className)} {...props}>
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-8', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-8 border-t border-noir-border bg-noir-bg', className)} {...props}>
    {children}
  </div>
);
