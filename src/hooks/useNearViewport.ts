import { RefObject, useEffect, useRef, useState } from 'react';

export const useNearViewport = <T extends HTMLElement = HTMLDivElement>(rootMargin = '320px') => {
  const ref = useRef<T | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    if (isNearViewport) {
      return undefined;
    }

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return undefined;
    }

    const node = ref.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isNearViewport, rootMargin]);

  return {
    ref: ref as RefObject<T>,
    isNearViewport,
  };
};
