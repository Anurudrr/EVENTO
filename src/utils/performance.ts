type NetworkInformationLike = {
  saveData?: boolean;
};

type PerformanceNavigator = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

const getPerformanceNavigator = () => (
  typeof navigator === 'undefined' ? null : navigator as PerformanceNavigator
);

const getConnection = () => {
  const performanceNavigator = getPerformanceNavigator();

  return performanceNavigator?.connection
    || performanceNavigator?.mozConnection
    || performanceNavigator?.webkitConnection
    || null;
};

export const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

export const isDesktopViewport = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(min-width: 1024px)').matches
);

export const isLowPowerDevice = () => {
  const performanceNavigator = getPerformanceNavigator();

  if (!performanceNavigator) {
    return false;
  }

  const deviceMemory = Number(performanceNavigator.deviceMemory);
  const hardwareConcurrency = Number(performanceNavigator.hardwareConcurrency);

  return Boolean(getConnection()?.saveData)
    || (Number.isFinite(deviceMemory) && deviceMemory > 0 && deviceMemory <= 4)
    || (Number.isFinite(hardwareConcurrency) && hardwareConcurrency > 0 && hardwareConcurrency <= 6);
};

export const shouldReduceMotion = () => prefersReducedMotion() || isLowPowerDevice();

export const canUseFinePointerInteractions = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  && !shouldReduceMotion()
);

export const shouldUseSmoothScroll = () => (
  !shouldReduceMotion()
  && isDesktopViewport()
);

export const shouldEnableCinematicEffects = () => {
  if (typeof window === 'undefined' || shouldReduceMotion()) {
    return false;
  }

  const performanceNavigator = getPerformanceNavigator();
  const hardwareConcurrency = Number(performanceNavigator?.hardwareConcurrency);
  const deviceMemory = Number(performanceNavigator?.deviceMemory);

  return window.matchMedia('(min-width: 1280px)').matches
    && (!Number.isFinite(hardwareConcurrency) || hardwareConcurrency >= 8)
    && (!Number.isFinite(deviceMemory) || deviceMemory >= 6);
};

export const shouldEnablePointerEffects = () => (
  canUseFinePointerInteractions()
  && isDesktopViewport()
  && !isLowPowerDevice()
);
