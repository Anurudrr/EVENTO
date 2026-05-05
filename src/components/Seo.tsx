import React, { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const SITE_NAME = 'EVENTO';

const upsertMetaTag = (selector: string, attributes: Record<string, string>, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      element?.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

export const Seo: React.FC<SeoProps> = ({
  title,
  description,
  path = '/',
  image = '/images/fallback.jpg',
  type = 'website',
  structuredData,
}) => {
  const canonicalUrl = typeof window === 'undefined'
    ? path
    : new URL(path, window.location.origin).toString();
  const imageUrl = typeof window === 'undefined'
    ? image
    : new URL(image, window.location.origin).toString();
  const serializedStructuredData = structuredData ? JSON.stringify(structuredData) : '';

  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`;

    upsertMetaTag('meta[name="description"]', { name: 'description' }, description);
    upsertMetaTag('meta[property="og:title"]', { property: 'og:title' }, `${title} | ${SITE_NAME}`);
    upsertMetaTag('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMetaTag('meta[property="og:type"]', { property: 'og:type' }, type);
    upsertMetaTag('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMetaTag('meta[property="og:image"]', { property: 'og:image' }, imageUrl);
    upsertMetaTag('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
    upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title' }, `${title} | ${SITE_NAME}`);
    upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image' }, imageUrl);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    if (serializedStructuredData) {
      let structuredDataTag = document.head.querySelector<HTMLScriptElement>('script[data-seo-structured-data]');
      if (!structuredDataTag) {
        structuredDataTag = document.createElement('script');
        structuredDataTag.type = 'application/ld+json';
        structuredDataTag.dataset.seoStructuredData = 'true';
        document.head.appendChild(structuredDataTag);
      }

      structuredDataTag.textContent = serializedStructuredData;
    }
  }, [canonicalUrl, description, imageUrl, serializedStructuredData, title, type]);

  return null;
};
