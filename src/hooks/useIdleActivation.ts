import { useEffect, useState } from 'react';

type IdleCallbackHandle = number;
type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

type WindowWithIdleCallback = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleCallback, options?: { timeout?: number }) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

export const useIdleActivation = (enabled: boolean, timeoutMs = 1200) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      return undefined;
    }

    if (isActive) {
      return undefined;
    }

    if (typeof window === 'undefined') {
      setIsActive(true);
      return undefined;
    }

    const idleWindow = window as WindowWithIdleCallback;

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const handle = idleWindow.requestIdleCallback(() => {
        setIsActive(true);
      }, { timeout: timeoutMs });

      return () => {
        idleWindow.cancelIdleCallback?.(handle);
      };
    }

    const timer = window.setTimeout(() => {
      setIsActive(true);
    }, Math.max(200, timeoutMs / 2));

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, isActive, timeoutMs]);

  return isActive;
};
