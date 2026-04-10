let razorpayLoader: Promise<boolean> | null = null;

export const loadRazorpayCheckout = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayLoader) {
    razorpayLoader = new Promise<boolean>((resolve) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve(Boolean(window.Razorpay));
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    }).finally(() => {
      razorpayLoader = null;
    });
  }

  return razorpayLoader;
};
