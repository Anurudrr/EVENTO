import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnimation } from '../../animations/AnimationProvider';

gsap.registerPlugin(ScrollTrigger);

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
      const revealTargets = gsap.utils.toArray<HTMLElement>('[data-scene-reveal]');
      const parallaxTargets = gsap.utils.toArray<HTMLElement>('[data-scene-parallax]');

      if (revealTargets.length > 0) {
        gsap.set(revealTargets, {
          opacity: 0,
          y: 48,
          filter: 'blur(18px)',
        });

        gsap.timeline({
          defaults: {
            duration: 1.05,
            ease: 'power3.out',
          },
          scrollTrigger: {
            trigger: sectionElement,
            start: 'top 78%',
            end: 'bottom 50%',
            toggleActions: 'play none none reverse',
          },
        }).to(revealTargets, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          stagger: 0.1,
        });
      }

      parallaxTargets.forEach((target) => {
        gsap.fromTo(target, {
          yPercent: 0,
        }, {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [isReducedMotion]);

  return (
    <section id={id} ref={sectionRef} className={`scene-section ${className}`.trim()}>
      {children}
    </section>
  );
};
