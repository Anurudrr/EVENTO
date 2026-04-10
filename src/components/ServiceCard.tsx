import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Bookmark, Briefcase, MapPin, Share2, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Service } from '../types';
import {
  FALLBACK_IMAGE_URL,
  formatPriceLabel,
  formatServicePrice,
  getServiceDescription,
  getServiceImageUrls,
  getServiceLocation,
  getServiceTitle,
  logImageDebug,
} from '../utils';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = React.memo(({ service }) => {
  const serviceId = service._id;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const cardFrameRef = React.useRef<HTMLDivElement | null>(null);

  const primaryImage = React.useMemo(() => {
    const [firstImage] = getServiceImageUrls(service);
    return firstImage || FALLBACK_IMAGE_URL;
  }, [service]);
  const serviceTitle = getServiceTitle(service);
  const serviceDescription = getServiceDescription(service);
  const serviceLocation = getServiceLocation(service);

  useEffect(() => {
    let mounted = true;

    const loadWishlist = async () => {
      if (!isAuthenticated) {
        setIsSaved(false);
        return;
      }

      try {
        const wishlist = await userService.getWishlist();
        if (mounted) {
          setIsSaved(wishlist.some((item) => item._id === serviceId));
        }
      } catch {
        if (mounted) {
          setIsSaved(false);
        }
      }
    };

    loadWishlist();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, serviceId]);

  useEffect(() => {
    logImageDebug('ServiceCard', {
      _id: service._id,
      title: serviceTitle,
      images: service.images,
    });
  }, [service, serviceTitle]);

  useEffect(() => {
    const frame = cardFrameRef.current;
    if (!frame || typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = frame.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width;
      const offsetY = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - offsetY) * 12;
      const rotateY = (offsetX - 0.5) * 14;

      frame.style.setProperty('--service-rotate-x', `${rotateX.toFixed(2)}deg`);
      frame.style.setProperty('--service-rotate-y', `${rotateY.toFixed(2)}deg`);
      frame.style.setProperty('--service-glow-x', `${(offsetX * 100).toFixed(2)}%`);
      frame.style.setProperty('--service-glow-y', `${(offsetY * 100).toFixed(2)}%`);
    };

    const resetFrame = () => {
      frame.style.setProperty('--service-rotate-x', '0deg');
      frame.style.setProperty('--service-rotate-y', '0deg');
      frame.style.setProperty('--service-glow-x', '50%');
      frame.style.setProperty('--service-glow-y', '50%');
    };

    frame.addEventListener('pointermove', handlePointerMove);
    frame.addEventListener('pointerleave', resetFrame);
    frame.addEventListener('pointercancel', resetFrame);

    return () => {
      frame.removeEventListener('pointermove', handlePointerMove);
      frame.removeEventListener('pointerleave', resetFrame);
      frame.removeEventListener('pointercancel', resetFrame);
      resetFrame();
    };
  }, [serviceId]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      if (isSaved) {
        await userService.removeFromWishlist(serviceId);
        setIsSaved(false);
      } else {
        await userService.addToWishlist(serviceId);
        setIsSaved(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: serviceTitle,
      text: `${serviceTitle} on EVENTO`,
      url: `${window.location.origin}/event/${serviceId}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch {
      // Ignore browser-level share failures.
    }
  };

  return (
    <motion.article
      data-cursor="VIEW"
      className="service-card group relative h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -8 }}
    >
      <div ref={cardFrameRef} className="service-card__frame">
        <div className="service-card__spotlight" />
        <div className="service-card__shell">
          <div className="service-card__media">
            <Link to={`/event/${serviceId}`} className="block h-full">
              <img
                src={primaryImage}
                alt={serviceTitle}
                className="service-card__image"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                }}
              />
            </Link>

            <div className="service-card__veil" />

            <div className="service-card__topline">
              <span className="service-card__category">{service.category}</span>
              <div className="service-card__actions">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isSaving}
                  className={`service-card__action ${isSaved ? 'is-saved' : ''}`}
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="service-card__action"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="service-card__headline">
              <div className="service-card__headline-copy">
                <span className="service-card__eyebrow">Bookable experience</span>
                <h3 className="service-card__title">{serviceTitle}</h3>
              </div>
              <div className="service-card__arrow">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="service-card__body">
            <div className="service-card__meta-grid">
              <div className="service-card__meta-chip">
                <Star className="h-4 w-4" />
                <span>
                  {service.reviews ? `${service.rating.toFixed(1)} (${service.reviews})` : 'New listing'}
                </span>
              </div>
              <div className="service-card__meta-chip">
                <MapPin className="h-4 w-4" />
                <span>{serviceLocation}</span>
              </div>
            </div>

            <p className="service-card__description">{serviceDescription}</p>

            <div className="service-card__footer">
              <div className="service-card__pricing">
                <span className="service-card__pricing-label">Pricing</span>
                <strong>{formatServicePrice(service.price)}</strong>
                <p>{formatPriceLabel(service.price, service.priceLabel)}</p>
              </div>

              <div className="service-card__footer-actions">
                <div className="service-card__mini-chip">
                  <Briefcase className="h-4 w-4" />
                  <span>{service.category}</span>
                </div>
                <Link to={`/event/${serviceId}`} className="service-card__cta">
                  View service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
});
