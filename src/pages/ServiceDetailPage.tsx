import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { ReviewSection } from '../components/ReviewSection';
import { ServiceCard } from '../components/ServiceCard';
import { UpiPaymentModal } from '../components/UpiPaymentModal';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { bookingService } from '../services/bookingService';
import { serviceService } from '../services/serviceService';
import { userService } from '../services/userService';
import { Booking, Service, User } from '../types';
import {
  FALLBACK_IMAGE_URL,
  formatDate,
  formatServicePrice,
  formatPriceLabel,
  getErrorMessage,
  getProfileImageUrl,
  getServiceImageUrls,
  getServiceDescription,
  getServiceLocation,
  getServiceTitle,
  getUserBio,
  getUserDisplayName,
} from '../utils';

const bookingEventTypes = [
  'Wedding',
  'Corporate Event',
  'Birthday',
  'Private Party',
  'Festival',
  'Engagement',
  'Other',
];

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
  const [bookingForm, setBookingForm] = useState({
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
      if (navigator.share) {
        await navigator.share(payload);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(payload.url);
        showToast('Service link copied', 'success');
      }
    } catch {
      showToast('Unable to share right now', 'error');
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

  return (
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
                    <div className="mt-5 flex flex-wrap gap-4 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">
                      <a href={`mailto:${organizer.email}?subject=${encodeURIComponent(`Service inquiry: ${serviceTitle}`)}`} className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email organizer
                      </a>
                      {organizer.upiId && (
                        <span className="inline-flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Payments enabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ReviewSection serviceId={service._id} />
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-32 space-y-8">
              <div className="border border-noir-border bg-noir-card p-8 md:p-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-noir-accent">Book this service</div>
                    <div className="mt-3 text-3xl font-display font-semibold text-noir-ink">{formatServicePrice(service.price)}</div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{formatPriceLabel(service.price, service.priceLabel)}</p>
                  </div>
                  <div className="border border-noir-border bg-noir-bg px-4 py-3 text-right">
                    <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Rating</div>
                    <div className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">
                      <Star className="h-4 w-4 text-noir-accent" />
                      {service.reviews ? Number(service.rating || 0).toFixed(1) : 'New'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Contact name</label>
                      <input
                        type="text"
                        value={bookingForm.contactName}
                        onChange={(event) => updateBookingForm('contactName', event.target.value)}
                        placeholder="Your full name"
                        className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Phone number</label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-noir-muted" />
                        <input
                          type="tel"
                          value={bookingForm.phone}
                          onChange={(event) => updateBookingForm('phone', event.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full border border-noir-border bg-noir-bg py-4 pl-11 pr-5 text-noir-ink focus:border-noir-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Event type</label>
                      <select
                        value={bookingForm.eventType}
                        onChange={(event) => updateBookingForm('eventType', event.target.value)}
                        className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
                      >
                        {bookingEventTypes.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Guests</label>
                      <input
                        type="number"
                        min="1"
                        value={bookingForm.guests}
                        onChange={(event) => updateBookingForm('guests', event.target.value)}
                        className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Event location</label>
                    <input
                      type="text"
                      value={bookingForm.eventLocation}
                      onChange={(event) => updateBookingForm('eventLocation', event.target.value)}
                      placeholder="Venue or city"
                      className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Booking date</label>
                      <input
                        type="date"
                        value={bookingForm.date}
                        onChange={(event) => updateBookingForm('date', event.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Time</label>
                      <div className="relative">
                        <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-noir-muted" />
                        <input
                          type="time"
                          value={bookingForm.time}
                          onChange={(event) => updateBookingForm('time', event.target.value)}
                          className="w-full border border-noir-border bg-noir-bg py-4 pl-11 pr-5 text-noir-ink focus:border-noir-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Special requests</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(event) => updateBookingForm('notes', event.target.value)}
                      rows={4}
                      placeholder="Tell the organizer about style, venue, timings, or custom requests"
                      className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={submitting}
                  className="btn-noir mt-8 flex w-full items-center justify-center gap-3 !rounded-none !py-5"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarClock className="h-5 w-5" />}
                  Book Now
                </button>

                <div className="mt-8 space-y-3 border-t border-noir-border pt-8 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-muted">
                  <div className="flex items-center gap-3"><Check className="h-4 w-4 text-noir-accent" /> Instant UPI QR checkout with live verification updates</div>
                  <div className="flex items-center gap-3"><Users className="h-4 w-4 text-noir-accent" /> Guest count, event type, and phone number are shared with the organizer</div>
                  <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-noir-accent" /> Reviews unlock after a completed booking</div>
                </div>
              </div>

              {blockedDates.length > 0 && (
                <div className="border border-noir-border bg-noir-card p-8">
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Unavailable dates</p>
                  <div className="mt-4 space-y-3">
                    {blockedDates.slice(0, 5).map((entry) => (
                      <div key={entry.date} className="border border-noir-border bg-noir-bg px-4 py-3">
                        <p className="text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">{formatDate(entry.date)}</p>
                        {entry.note && <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{entry.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
  );
};

export default ServiceDetailPage;
