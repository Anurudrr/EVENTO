import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAnimation } from '../../animations/AnimationProvider';

interface SceneSectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export const SceneSection: React.FC<SceneSectionProps> = ({
  id,
  className = '',
  children,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { isReducedMotion } = useAnimation();

  useEffect(() => {
    if (!sectionRef.current || isReducedMotion) {
      return undefined;
    }

    const sectionElement = sectionRef.current;
    const ctx = gsap.context(() => {
      const revealTargets: HTMLElement[] = Array.from(sectionElement.querySelectorAll<HTMLElement>('[data-scene-reveal]'));
      let revealCompleted = false;
      let revealObserver: IntersectionObserver | null = null;

      const revealSection = () => {
        if (revealCompleted || revealTargets.length === 0) {
          return;
        }

        revealCompleted = true;
        revealObserver?.disconnect();

        gsap.to(revealTargets, {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'willChange',
        });
      };

      if (revealTargets.length > 0) {
        gsap.set(revealTargets, {
          opacity: 0,
          y: 20,
          willChange: 'transform, opacity',
        });
      }

      revealObserver = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          revealSection();
        }
      }, {
        threshold: 0.05,
        rootMargin: '0px 0px -8% 0px',
      });

      revealObserver.observe(sectionElement);

      const fallbackTimer = window.setTimeout(() => {
        if (!revealCompleted && sectionElement.getBoundingClientRect().top < window.innerHeight * 0.9) {
          revealSection();
        }
      }, 1400);

      return () => {
        window.clearTimeout(fallbackTimer);
        revealObserver?.disconnect();
        gsap.killTweensOf(revealTargets);
      };
    }, sectionRef);

    return () => {
      const revealTargets = Array.from(sectionElement.querySelectorAll<HTMLElement>('[data-scene-reveal]'));
      gsap.set(revealTargets, {
        opacity: 1,
        y: 0,
        clearProps: 'willChange',
      });
      ctx.revert();
    };
  }, [isReducedMotion]);

  return (
    <section id={id} ref={sectionRef} className={`scene-section ${className}`.trim()}>
      {children}
    </section>
  );
};
