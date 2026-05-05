import React, { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { shouldEnablePointerEffects } from '../../utils/performance';

const canUseInteractiveCursor = () => (
  typeof window !== 'undefined'
  && shouldEnablePointerEffects()
);

export const CustomCursor: React.FC = React.memo(() => {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState('');
  const pointerX = useMotionValue(-120);
  const pointerY = useMotionValue(-120);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    const desktopMedia = window.matchMedia('(min-width: 1024px)');
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateEnabled = () => {
      setEnabled(canUseInteractiveCursor());
    };

    updateEnabled();

    hoverMedia.addEventListener('change', updateEnabled);
    desktopMedia.addEventListener('change', updateEnabled);
    reducedMotionMedia.addEventListener('change', updateEnabled);
    window.addEventListener('resize', updateEnabled, { passive: true });

    return () => {
      hoverMedia.removeEventListener('change', updateEnabled);
      desktopMedia.removeEventListener('change', updateEnabled);
      reducedMotionMedia.removeEventListener('change', updateEnabled);
      window.removeEventListener('resize', updateEnabled);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    document.body.classList.toggle('custom-cursor-enabled', enabled);

    return () => {
      document.body.classList.remove('custom-cursor-enabled');
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      setActive(false);
      setLabel('');
      return undefined;
    }

    const resolveCursorTarget = (target: EventTarget | null) => (
      target instanceof Element ? target.closest<HTMLElement>('[data-cursor]') : null
    );

    const handlePointerMove = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      setVisible((current) => (current ? current : true));
    };

    const handlePointerOver = (event: PointerEvent) => {
      const cursorTarget = resolveCursorTarget(event.target);
      const nextActive = Boolean(cursorTarget);
      const nextLabel = cursorTarget?.dataset.cursor || '';
      setActive((current) => (current === nextActive ? current : nextActive));
      setLabel((current) => (current === nextLabel ? current : nextLabel));
    };

    const handlePointerOut = (event: PointerEvent) => {
      const nextTarget = resolveCursorTarget(event.relatedTarget);
      if (nextTarget) {
        return;
      }

      setActive((current) => (current ? false : current));
      setLabel((current) => (current ? '' : current));
    };

    const handleWindowLeave = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        setVisible((current) => (current ? false : current));
      }
    };

    const handleWindowBlur = () => {
      setVisible(false);
      setActive(false);
      setLabel('');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver);
    window.addEventListener('pointerout', handlePointerOut);
    window.addEventListener('mouseout', handleWindowLeave);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('mouseout', handleWindowLeave);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, pointerX, pointerY]);

  if (!enabled) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      className={`custom-cursor ${visible ? 'opacity-100' : 'opacity-0'} ${active ? 'is-active' : ''}`}
      style={{
        x: pointerX,
        y: pointerY,
      }}
    >
      <div className="custom-cursor__ring" />
      <div className="custom-cursor__core" />
      <div className="custom-cursor__label">{label || 'DRAG'}</div>
    </motion.div>
  );
});
