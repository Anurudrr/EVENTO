/**
 * Transforms a Cloudinary upload URL to include automatic optimizations.
 * Only modifies genuine Cloudinary URLs — passes all other URLs through unchanged.
 */
export const optimizeImage = (url: string, width = 400): string => {
  if (!url || typeof url !== 'string') return '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com')) return url;

  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
};

/**
 * Returns an optimized thumbnail URL suitable for list/card views.
 */
export const toThumbnailUrl = (url: string): string => optimizeImage(url, 400);

/**
 * Returns an optimized full-size URL suitable for detail/hero views.
 */
export const toFullUrl = (url: string): string => optimizeImage(url, 1200);
