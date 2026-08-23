import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  shouldReduceMotion,
} from '../utils/performance';

const AnimationContext = createContext<{
  isReducedMotion: boolean;
  allowCinematicEffects: boolean;
  allowPointerEffects: boolean;
  useSmoothScroll: boolean;
} | null>(null);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) throw new Error('useAnimation must be used within AnimationProvider');
  return context;
};

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [allowCinematicEffects, setAllowCinematicEffects] = useState(false);
  const [allowPointerEffects, setAllowPointerEffects] = useState(false);
  const [useSmoothScroll, setUseSmoothScroll] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setIsReducedMotion(shouldReduceMotion());
      setAllowCinematicEffects(false);
      setAllowPointerEffects(false);
      setUseSmoothScroll(false);
    };

    handleChange();
    reducedMotionMedia.addEventListener('change', handleChange);
    window.addEventListener('resize', handleChange, { passive: true });

    return () => {
      reducedMotionMedia.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleChange);
    };
  }, []);

  const value = useMemo(() => ({
    isReducedMotion,
    allowCinematicEffects,
    allowPointerEffects,
    useSmoothScroll,
  }), [allowCinematicEffects, allowPointerEffects, isReducedMotion, useSmoothScroll]);

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};
