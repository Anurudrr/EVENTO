import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  shouldEnableCinematicEffects,
  shouldEnablePointerEffects,
  shouldReduceMotion,
  shouldUseSmoothScroll,
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

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopMedia = window.matchMedia('(min-width: 1024px)');
    const cinematicMedia = window.matchMedia('(min-width: 1280px)');
    const handleChange = () => {
      setIsReducedMotion(shouldReduceMotion());
      setAllowCinematicEffects(shouldEnableCinematicEffects());
      setAllowPointerEffects(shouldEnablePointerEffects());
      setUseSmoothScroll(shouldUseSmoothScroll());
    };

    handleChange();
    reducedMotionMedia.addEventListener('change', handleChange);
    desktopMedia.addEventListener('change', handleChange);
    cinematicMedia.addEventListener('change', handleChange);
    window.addEventListener('resize', handleChange, { passive: true });

    return () => {
      reducedMotionMedia.removeEventListener('change', handleChange);
      desktopMedia.removeEventListener('change', handleChange);
      cinematicMedia.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!useSmoothScroll) {
      return undefined;
    }

    const nextLenis = new Lenis({
      duration: 0.82,
      lerp: 0.12,
      smoothWheel: true,
      gestureOrientation: 'vertical',
      wheelMultiplier: 0.82,
      touchMultiplier: 1,
      syncTouch: false,
    });

    nextLenis.on('scroll', ScrollTrigger.update);

    const ticker = (time: number) => {
      nextLenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(ticker);
      nextLenis.destroy();
    };
  }, [useSmoothScroll]);

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
