import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Clock3,
  Mail,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { ReviewSection } from '../components/ReviewSection';
import { ServiceCard } from '../components/ServiceCard';
import { Seo } from '../components/Seo';
import { UpiPaymentModal } from '../components/UpiPaymentModal';
import { Skeleton } from '../components/ui/Skeleton';
import { ServiceBookingPanel, ServiceBookingFormState } from '../components/service-detail/ServiceBookingPanel';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNearViewport } from '../hooks/useNearViewport';
import { bookingService } from '../services/bookingService';
import { serviceService } from '../services/serviceService';
import { userService } from '../services/userService';
import { Booking, Service, ServiceLocation as BookingServiceLocation, User } from '../types';
import {
  FALLBACK_IMAGE_URL,
  formatDate,
  formatPriceLabel,
  formatResponseTime,
  formatServicePrice,
  formatVerificationStatus,
  getErrorMessage,
  getProfileImageUrl,
  getServiceImageUrls,
  getServiceDescription,
  getServiceLocation,
  getServiceTitle,
  getUserBio,
  getUserDisplayName,
} from '../utils';
import { copyTextWithPermissionMemory, shareDataWithPermissionMemory } from '../utils/permissions';

const bookingEventTypes = [
  'Wedding',
  'Corporate Event',
  'Birthday',
  'Private Party',
  'Festival',
  'Engagement',
  'Other',
];
const EventoMap = lazy(() => import('../components/EventoMap').then((module) => ({ default: module.EventoMap })));

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [service, setService] = useState<Service | null>(null);
  const [relatedServices, setRelatedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [selectedServiceLocation, setSelectedServiceLocation] = useState<BookingServiceLocation | null>(null);
  const [bookingForm, setBookingForm] = useState<ServiceBookingFormState>({
    contactName: '',
    phone: '',
    eventType: bookingEventTypes[0],
    eventLocation: '',
    date: '',
    time: '',
    guests: '80',
    notes: '',
  });
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { ref: serviceMapRef, isNearViewport: showServiceMap } = useNearViewport<HTMLDivElement>('240px');

  useEffect(() => {
    if (user?.name) {
      setBookingForm((current) => ({
        ...current,
        contactName: current.contactName || user.name,
      }));
    }
  }, [user?.name]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      try {
        const [serviceData, wishlist] = await Promise.all([
          serviceService.getService(id),
          user ? userService.getWishlist() : Promise.resolve([]),
        ]);

        setService(serviceData);
        setActiveImage(getServiceImageUrls(serviceData)[0] || FALLBACK_IMAGE_URL);
        setIsSaved(wishlist.some((item) => item._id === id));
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load this service'), 'error');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, user?._id, showToast]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!service?._id || !service.category) {
        setRelatedServices([]);
        return;
      }

      setRelatedLoading(true);
      try {
        const results = await serviceService.getServices({
          category: service.category,
          limit: 4,
          sort: 'rating',
        });
        setRelatedServices(results.filter((item) => item._id !== service._id).slice(0, 3));
      } catch (error) {
        console.error('[service-detail:related]', error);
        setRelatedServices([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    void loadRelated();
  }, [service?._id, service?.category]);

  const gallery = useMemo(() => getServiceImageUrls(service), [service]);
  const organizer = typeof service?.organizer === 'object' ? service.organizer as User : null;
  const serviceTitle = getServiceTitle(service);
  const serviceDescription = getServiceDescription(service);
  const serviceLocation = getServiceLocation(service);
  const organizerName = getUserDisplayName(organizer);
  const organizerBio = organizer ? getUserBio(organizer) : '';
  const organizerVerificationStatus = organizer?.verificationStatus || 'unverified';
  const blockedDates = useMemo(
    () => (service?.availability || []).filter((entry) => !entry.isAvailable),
    [service?.availability],
  );

  const updateBookingForm = (field: keyof typeof bookingForm, value: string) => {
    setBookingForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleWishlistToggle = async () => {
    if (!id) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await userService.toggleWishlist(id);
      setIsSaved(result.saved);
      showToast(result.saved ? 'Saved to wishlist' : 'Removed from wishlist', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update wishlist'), 'error');
    }
  };

  const handleBooking = async () => {
    if (!id || !service) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    if (!bookingForm.contactName.trim() || !bookingForm.phone.trim() || !bookingForm.eventType.trim()) {
      showToast('Add your contact name, phone number, and event type', 'error');
      return;
    }

    if (!bookingForm.date || !bookingForm.time) {
      showToast('Select a booking date and time', 'error');
      return;
    }

    if (!selectedServiceLocation) {
      showToast('Select the service location on the map before booking', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingService.createBooking({
        serviceId: id,
        date: bookingForm.date,
        time: bookingForm.time,
        contactName: bookingForm.contactName.trim(),
        phone: bookingForm.phone.trim(),
        eventType: bookingForm.eventType.trim(),
        eventLocation: bookingForm.eventLocation.trim(),
        serviceLocation: selectedServiceLocation,
        guests: Number(bookingForm.guests || 1),
        notes: bookingForm.notes.trim(),
      });
      setActiveBooking(booking);
      setPaymentModalOpen(true);
      showToast('Booking created. Continue to payment.', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to create booking'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (booking: Booking) => {
    setActiveBooking(booking);
  };

  const handleShare = async () => {
    if (!service) {
      return;
    }

    const payload = {
      title: serviceTitle,
      text: `${serviceTitle} on EVENTO`,
      url: window.location.href,
    };

    try {
      const shared = await shareDataWithPermissionMemory(payload);

      if (!shared) {
        await copyTextWithPermissionMemory(payload.url);
        showToast('Service link copied', 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to share right now', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-noir-bg px-6 pb-20 pt-32">
        <div className="container mx-auto space-y-8">
          <Skeleton className="h-14 w-48" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <Skeleton className="h-[32rem] w-full" />
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))}
              </div>
              <Skeleton className="h-80 w-full" />
            </div>
            <div className="space-y-6 lg:col-span-5">
              <Skeleton className="h-[40rem] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return <div className="min-h-screen bg-noir-bg flex items-center justify-center text-noir-ink uppercase">Service not found</div>;
  }

  const policyBlocks = [
    {
      label: 'Cancellation policy',
      value: service.cancellationPolicy || 'No cancellation policy has been added yet. Confirm terms with the organizer before booking.',
    },
    {
      label: 'Refund policy',
      value: service.refundPolicy || 'Refund handling has not been added for this listing yet. Payments should be reviewed with the organizer before confirmation.',
    },
    {
      label: 'Service terms',
      value: service.serviceTerms || 'Specific setup, access, and delivery terms will be confirmed directly by the organizer after booking.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: serviceTitle,
    description: serviceDescription,
    areaServed: serviceLocation,
    image: gallery[0] || FALLBACK_IMAGE_URL,
    provider: organizer ? {
      '@type': 'Organization',
      name: organizer.businessName || organizerName,
    } : undefined,
    aggregateRating: service.reviews ? {
      '@type': 'AggregateRating',
      ratingValue: Number(service.rating || 0).toFixed(1),
      reviewCount: service.reviews || 0,
    } : undefined,
  };

  return (
    <>
      <Seo
        title={serviceTitle}
        description={serviceDescription}
        path={`/event/${service._id}`}
        image={gallery[0] || FALLBACK_IMAGE_URL}
        type="article"
        structuredData={structuredData}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="min-h-screen bg-noir-bg pb-24 pt-32">
        <div className="container mx-auto space-y-16 px-6">
        <div className="flex flex-col gap-6 border border-noir-border bg-noir-card p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/events" className="inline-flex items-center gap-3 text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to services
            </Link>
            <div className="mt-5 inline-flex items-center gap-3 border border-noir-accent/20 bg-noir-accent/10 px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-noir-accent">
              <Sparkles className="h-4 w-4" />
              {service.category || 'General'}
            </div>
            {organizer && (
              <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-mono font-semibold uppercase tracking-[0.3em]">
                <div className={`inline-flex items-center gap-2 border px-4 py-2 ${
                  organizerVerificationStatus === 'verified'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                    : organizerVerificationStatus === 'pending'
                      ? 'border-amber-500/20 bg-amber-500/10 text-amber-600'
                      : 'border-noir-border bg-noir-bg text-noir-muted'
                }`}>
                  <ShieldCheck className="h-4 w-4" />
                  {formatVerificationStatus(organizerVerificationStatus)}
                </div>
                {organizer.responseTimeHours ? (
                  <div className="inline-flex items-center gap-2 border border-noir-border bg-noir-bg px-4 py-2 text-noir-accent">
                    <Clock3 className="h-4 w-4" />
                    {formatResponseTime(organizer.responseTimeHours)}
                  </div>
                ) : null}
              </div>
            )}
            <h1 className="mt-5 text-4xl font-display font-semibold uppercase tracking-wide text-noir-ink md:text-6xl">{serviceTitle}</h1>
            <p className="mt-4 max-w-3xl text-sm uppercase tracking-wide text-noir-muted md:text-base">{serviceDescription}</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="flex h-12 w-12 items-center justify-center border border-noir-border bg-noir-bg text-noir-accent">
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`flex h-12 items-center justify-center gap-3 border px-5 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] ${
                isSaved ? 'border-noir-accent bg-noir-accent text-noir-bg' : 'border-noir-border bg-noir-bg text-noir-accent'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <div className="border border-noir-border bg-noir-card p-4">
              <img
                src={activeImage || gallery[0] || FALLBACK_IMAGE_URL}
                alt={serviceTitle}
                className="image-safe h-[22rem] w-full border border-noir-border object-cover md:h-[34rem]"
                loading="eager"
                decoding="async"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                }}
              />
              <div className="mt-4 grid grid-cols-4 gap-4">
                {gallery.slice(0, 4).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className={`overflow-hidden border ${activeImage === image ? 'border-noir-accent' : 'border-noir-border'} bg-noir-bg`}
                  >
                    <img
                      src={image}
                      alt={`${serviceTitle} preview ${index + 1}`}
                      className="image-safe h-24 w-full object-cover md:h-28"
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border border-noir-border bg-noir-card p-6">
                <div className="mb-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Location</div>
                <div className="flex items-center gap-3 uppercase tracking-wide text-noir-ink">
                  <MapPin className="h-4 w-4 text-noir-accent" />
                  <span>{serviceLocation}</span>
                </div>
              </div>
              <div className="border border-noir-border bg-noir-card p-6">
                <div className="mb-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Average rating</div>
                <div className="flex items-center gap-3 uppercase tracking-wide text-noir-ink">
                  <Star className="h-4 w-4 text-noir-accent" />
                  <span>{service.reviews ? `${Number(service.rating ?? 0).toFixed(1)} / 5` : 'New listing'}</span>
                </div>
              </div>
              <div className="border border-noir-border bg-noir-card p-6">
                <div className="mb-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Reviews</div>
                <div className="uppercase tracking-wide text-noir-ink">{service.reviews || 0} published</div>
              </div>
            </div>

            <div className="border border-noir-border bg-noir-card p-8 md:p-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Venue map</p>
                  <h2 className="mt-3 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">See the pinned location</h2>
                </div>
                <p className="max-w-xl text-xs uppercase tracking-wide text-noir-muted">
                  Exact coordinates appear here whenever the organizer pins a venue on the publishing form.
                </p>
              </div>

              <div ref={serviceMapRef} className="mt-8">
                {showServiceMap ? (
                  <Suspense fallback={<div className="h-[360px] border border-noir-border bg-white/80 skeleton-shimmer" />}>
                    <EventoMap
                      events={[service]}
                      emptyMessage="This organizer has not pinned an exact venue yet."
                      height={360}
                    />
                  </Suspense>
                ) : (
                  <div className="h-[360px] border border-noir-border bg-white/80 skeleton-shimmer" />
                )}
              </div>
            </div>

            <div className="border border-noir-border bg-noir-card p-8 md:p-10">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Pricing</p>
                  <p className="mt-3 text-3xl font-display font-semibold text-noir-ink">{formatServicePrice(service.price)}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">{formatPriceLabel(service.price, service.priceLabel)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Why clients book this</p>
                  <div className="mt-3 space-y-3 text-xs uppercase tracking-wide text-noir-muted">
                    <div className="flex items-center gap-3"><Check className="h-4 w-4 text-noir-accent" /> Secure booking and payment tracking</div>
                    <div className="flex items-center gap-3"><Check className="h-4 w-4 text-noir-accent" /> Direct organizer coordination after payment</div>
                    <div className="flex items-center gap-3"><Check className="h-4 w-4 text-noir-accent" /> Reviews published from completed bookings only</div>
                  </div>
                </div>
              </div>
            </div>

            {organizer && (
              <div className="border border-noir-border bg-noir-card p-8 md:p-10">
                <div className="mb-4 text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-noir-accent">Organizer profile</div>
                <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
                  <img
                    src={getProfileImageUrl(organizer)}
                    alt={organizerName}
                    className="image-safe h-24 w-24 border border-noir-border object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                    }}
                  />
                  <div>
                    <h2 className="text-2xl font-display font-semibold uppercase tracking-wide text-noir-ink">{organizerName}</h2>
                    <p className="mt-3 text-sm uppercase tracking-wide text-noir-muted">{organizerBio}</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="border border-noir-border bg-noir-bg px-4 py-4">
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Verification</p>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">
                          {formatVerificationStatus(organizerVerificationStatus)}
                        </p>
                      </div>
                      <div className="border border-noir-border bg-noir-bg px-4 py-4">
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Response SLA</p>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">
                          {formatResponseTime(organizer.responseTimeHours)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="border border-noir-border bg-noir-bg px-4 py-4">
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Business name</p>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">
                          {organizer.businessName || organizerName}
                        </p>
                      </div>
                      <div className="border border-noir-border bg-noir-bg px-4 py-4">
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Operating location</p>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">
                          {organizer.businessLocation || serviceLocation}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-4 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">
                      <a href={`mailto:${organizer.email}?subject=${encodeURIComponent(`Service inquiry: ${serviceTitle}`)}`} className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email organizer
                      </a>
                      {organizerVerificationStatus === 'verified' && (
                        <span className="inline-flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Verified organizer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-noir-border bg-noir-card p-8 md:p-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Booking policies</p>
                  <h2 className="mt-3 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">Know the terms before you book</h2>
                </div>
                <p className="max-w-xl text-xs uppercase tracking-wide text-noir-muted">
                  These details are shown before payment so buyers can review cancellation, refund, and fulfillment expectations directly on the listing.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {policyBlocks.map((policy) => (
                  <div key={policy.label} className="border border-noir-border bg-noir-bg p-5">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">{policy.label}</p>
                    <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">{policy.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <ReviewSection serviceId={service._id} />
          </div>

          <aside className="lg:col-span-5">
            <ServiceBookingPanel
              service={service}
              bookingForm={bookingForm}
              blockedDates={blockedDates}
              selectedServiceLocation={selectedServiceLocation}
              submitting={submitting}
              eventTypes={bookingEventTypes}
              onFieldChange={updateBookingForm}
              onLocationSelect={setSelectedServiceLocation}
              onSubmit={handleBooking}
            />
          </aside>
        </div>

        <section className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Discover more</p>
              <h2 className="mt-3 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">Related services</h2>
            </div>
          </div>

          {relatedLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[32rem] w-full" />
              ))}
            </div>
          ) : relatedServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {relatedServices.map((item) => (
                <ServiceCard key={item._id} service={item} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-noir-border bg-noir-card px-6 py-10 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
              No similar services available yet.
            </div>
          )}
        </section>
      </div>

        <UpiPaymentModal
          open={paymentModalOpen}
          booking={activeBooking}
          service={service}
          onClose={() => setPaymentModalOpen(false)}
          onPaid={handlePaymentSuccess}
        />
      </motion.div>
    </>
  );
};

export default ServiceDetailPage;
