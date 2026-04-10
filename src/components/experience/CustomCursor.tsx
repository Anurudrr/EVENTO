import React, { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

const canUseInteractiveCursor = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

export const CustomCursor: React.FC = () => {
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
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateEnabled = () => {
      setEnabled(canUseInteractiveCursor());
    };

    updateEnabled();

    hoverMedia.addEventListener('change', updateEnabled);
    reducedMotionMedia.addEventListener('change', updateEnabled);

    return () => {
      hoverMedia.removeEventListener('change', updateEnabled);
      reducedMotionMedia.removeEventListener('change', updateEnabled);
    };
  }, []);

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
      setVisible(true);
    };

    const handlePointerOver = (event: PointerEvent) => {
      const cursorTarget = resolveCursorTarget(event.target);
      setActive(Boolean(cursorTarget));
      setLabel(cursorTarget?.dataset.cursor || '');
    };

    const handlePointerOut = (event: PointerEvent) => {
      const nextTarget = resolveCursorTarget(event.relatedTarget);
      if (nextTarget) {
        return;
      }

      setActive(false);
      setLabel('');
    };

    const handleWindowLeave = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        setVisible(false);
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
};
