import React, { createContext, useContext, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const AnimationContext = createContext<{
  lenis: any | null;
  isReducedMotion: boolean;
} | null>(null);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) throw new Error('useAnimation must be used within AnimationProvider');
  return context;
};

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lenis, setLenis] = useState<any | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setIsReducedMotion(reducedMotionMedia.matches);
    };

    handleChange();
    reducedMotionMedia.addEventListener('change', handleChange);

    return () => {
      reducedMotionMedia.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const nextLenis = new Lenis({
      duration: 1.18,
      lerp: 0.085,
      smoothWheel: true,
      gestureOrientation: 'vertical',
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
      syncTouch: false,
    });

    nextLenis.on('scroll', ScrollTrigger.update);
    setLenis(nextLenis);

    const ticker = (time: number) => {
      nextLenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(ticker);
      nextLenis.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <AnimationContext.Provider value={{ lenis, isReducedMotion }}>
      {children}
    </AnimationContext.Provider>
  );
};
