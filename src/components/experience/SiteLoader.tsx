import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'evento.loader.seen';
const MIN_LOADER_DURATION_MS = 1450;

export const SiteLoader: React.FC = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.sessionStorage.getItem(STORAGE_KEY) !== '1';
  });

  useEffect(() => {
    if (!visible || typeof window === 'undefined') {
      return undefined;
    }

    const startTime = window.performance.now();
    let releaseTimer = 0;
    let fallbackTimer = 0;

    document.body.classList.add('overflow-hidden');

    const finish = () => {
      const elapsed = window.performance.now() - startTime;
      const remaining = Math.max(0, MIN_LOADER_DURATION_MS - elapsed);

      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(() => {
        window.sessionStorage.setItem(STORAGE_KEY, '1');
        document.body.classList.remove('overflow-hidden');
        setVisible(false);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
    }

    fallbackTimer = window.setTimeout(finish, MIN_LOADER_DURATION_MS + 450);

    return () => {
      window.removeEventListener('load', finish);
      window.clearTimeout(releaseTimer);
      window.clearTimeout(fallbackTimer);
      document.body.classList.remove('overflow-hidden');
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="site-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
        >
          <div className="site-loader__grain" />
          <motion.div
            className="site-loader__content"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="site-loader__eyebrow">Live marketplace for event experiences</span>
            <div className="site-loader__title">
              <span>EVENTO</span>
              <span>EVENTO</span>
            </div>
            <div className="site-loader__bar">
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.15, ease: [0.65, 0, 0.35, 1] }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
