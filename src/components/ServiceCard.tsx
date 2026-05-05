import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Bookmark, Briefcase, Clock3, MapPin, Share2, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Service } from '../types';
import {
  FALLBACK_IMAGE_URL,
  formatPriceLabel,
  formatResponseTime,
  formatServicePrice,
  getServiceDescription,
  getServiceImageUrls,
  getServiceLocation,
  getServiceTitle,
  logImageDebug,
} from '../utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { shouldEnablePointerEffects } from '../utils/performance';
import { copyTextWithPermissionMemory, shareDataWithPermissionMemory } from '../utils/permissions';

interface ServiceCardProps {
  service: Service;
  withEntryAnimation?: boolean;
}

const entryAnimationProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
} as const;

export const ServiceCard: React.FC<ServiceCardProps> = React.memo(({ service, withEntryAnimation = true }) => {
  const serviceId = service._id;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const cardFrameRef = React.useRef<HTMLDivElement | null>(null);
  const pointerFrameRef = React.useRef<number>(0);
  const boundsRef = React.useRef<DOMRect | null>(null);
  const pointerRef = React.useRef({ x: 0, y: 0 });

  const primaryImage = React.useMemo(() => {
    const [firstImage] = getServiceImageUrls(service);
    return firstImage || FALLBACK_IMAGE_URL;
  }, [service]);
  const organizer = typeof service.organizer === 'object' ? service.organizer : null;
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
    if (!frame || typeof window === 'undefined' || !shouldEnablePointerEffects()) {
      return undefined;
    }

    const applyPointerTransform = () => {
      pointerFrameRef.current = 0;

      const rect = boundsRef.current;
      if (!rect || rect.width === 0 || rect.height === 0) {
        return;
      }

      const offsetX = (pointerRef.current.x - rect.left) / rect.width;
      const offsetY = (pointerRef.current.y - rect.top) / rect.height;
      const rotateX = (0.5 - offsetY) * 12;
      const rotateY = (offsetX - 0.5) * 14;

      frame.style.setProperty('--service-rotate-x', `${rotateX.toFixed(2)}deg`);
      frame.style.setProperty('--service-rotate-y', `${rotateY.toFixed(2)}deg`);
      frame.style.setProperty('--service-glow-x', `${(offsetX * 100).toFixed(2)}%`);
      frame.style.setProperty('--service-glow-y', `${(offsetY * 100).toFixed(2)}%`);
    };

    const handlePointerEnter = () => {
      boundsRef.current = frame.getBoundingClientRect();
      frame.style.willChange = 'transform';
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!boundsRef.current) {
        boundsRef.current = frame.getBoundingClientRect();
      }

      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;

      if (!pointerFrameRef.current) {
        pointerFrameRef.current = window.requestAnimationFrame(applyPointerTransform);
      }
    };

    const resetFrame = () => {
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = 0;
      }

      boundsRef.current = null;
      frame.style.willChange = 'auto';
      frame.style.setProperty('--service-rotate-x', '0deg');
      frame.style.setProperty('--service-rotate-y', '0deg');
      frame.style.setProperty('--service-glow-x', '50%');
      frame.style.setProperty('--service-glow-y', '50%');
    };

    frame.addEventListener('pointerenter', handlePointerEnter);
    frame.addEventListener('pointermove', handlePointerMove);
    frame.addEventListener('pointerleave', resetFrame);
    frame.addEventListener('pointercancel', resetFrame);

    return () => {
      frame.removeEventListener('pointerenter', handlePointerEnter);
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
      const shared = await shareDataWithPermissionMemory(shareData);

      if (!shared) {
        await copyTextWithPermissionMemory(shareData.url);
        showToast('Service link copied', 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to share right now', 'error');
    }
  };

  return (
    <motion.article
      data-cursor="VIEW"
      className="service-card group relative h-full"
      {...(withEntryAnimation ? entryAnimationProps : {})}
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
              <div className="flex items-center gap-2">
                <span className="service-card__category">{service.category}</span>
                {organizer?.verificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
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
              {organizer?.responseTimeHours ? (
                <div className="service-card__meta-chip">
                  <Clock3 className="h-4 w-4" />
                  <span>{formatResponseTime(organizer.responseTimeHours)}</span>
                </div>
              ) : null}
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
