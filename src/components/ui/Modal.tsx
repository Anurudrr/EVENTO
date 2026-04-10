import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-noir-ink/72 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              'relative z-10 w-full max-w-2xl overflow-hidden border border-white/50 bg-white/72 shadow-[0_30px_120px_rgba(12,18,28,0.18)] backdrop-blur-2xl',
              className
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-noir-accent/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,163,115,0.18),transparent_34%)]" />
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                {title && (
                  <h2 className="text-xl font-display font-semibold text-noir-ink tracking-wide uppercase leading-snug">
                    {title}
                  </h2>
                )}
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-none bg-noir-bg border border-noir-border flex items-center justify-center text-noir-accent hover:bg-noir-accent hover:text-noir-bg transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
