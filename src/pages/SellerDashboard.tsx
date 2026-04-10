import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CreditCard, LayoutDashboard, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { bookingService } from '../services/bookingService';
import { serviceService } from '../services/serviceService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Booking, Service } from '../types';
import { ChatPanel } from '../components/ChatPanel';
import { Skeleton } from '../components/ui/Skeleton';
import {
  FALLBACK_IMAGE_URL,
  formatBookingStatus,
  formatCurrency,
  formatDateTime,
  formatPriceLabel,
  formatServicePrice,
  getErrorMessage,
  getServiceTitle,
  getUserDisplayName,
} from '../utils';

const SellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);

  const load = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const [serviceData, bookingData] = await Promise.all([
        serviceService.getOrganizerServices(user._id),
        bookingService.getOrganizerBookings(),
      ]);
      setServices(serviceData);
      setBookings(bookingData);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to load organizer dashboard'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?._id]);

  const paidRevenue = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'verified').reduce((sum, booking) => sum + booking.amount, 0),
    [bookings],
  );

  const pendingVerification = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'paid_pending_verification').length,
    [bookings],
  );

  const stats = [
    { label: 'Services', value: services.length, icon: LayoutDashboard },
    { label: 'Bookings', value: bookings.length, icon: Calendar },
    { label: 'Revenue', value: formatCurrency(paidRevenue), icon: CreditCard },
  ];

  const updateBooking = (updatedBooking: Booking) => {
    setBookings((current) => current.map((booking) => booking._id === updatedBooking._id ? updatedBooking : booking));
  };

  const handleVerifyPayment = async (bookingId: string) => {
    try {
      const updated = await bookingService.verifyPayment(bookingId);
      updateBooking(updated);
      showToast('Payment verified', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to verify payment'), 'error');
    }
  };

  const handleStatusChange = async (bookingId: string, status: 'confirmed' | 'rejected' | 'completed') => {
    try {
      const updated = await bookingService.updateStatus(bookingId, status);
      updateBooking(updated);
      showToast(`Booking ${status}`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update booking'), 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">Organizer dashboard</h1>
          <p className="mt-3 text-sm uppercase tracking-wide text-noir-muted">
            Manage your services, incoming bookings, payment checks, and guest messages.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-noir-border bg-noir-card p-8">
              <stat.icon className="h-6 w-6 text-noir-accent" />
              <div className="mb-2 mt-4 text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-noir-muted">{stat.label}</div>
              <div className="text-2xl font-display font-semibold uppercase text-noir-ink">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="border border-noir-border bg-noir-card p-6 text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">
          {pendingVerification} payments awaiting verification
        </div>

        <section className="border border-noir-border bg-noir-card p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">Incoming bookings</h2>
              <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">Accept, reject, complete, and verify payment submissions.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full" />
            )) : bookings.length > 0 ? bookings.map((booking) => {
              const service = typeof booking.service === 'object' ? booking.service as Service : null;
              const buyer = typeof booking.user === 'object' ? booking.user : null;
              const serviceTitle = getServiceTitle(service);

              return (
                <div key={booking._id} className="border border-noir-border bg-noir-bg p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <p className="text-lg font-display font-semibold uppercase tracking-wide text-noir-ink">{serviceTitle}</p>
                        <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">
                          {formatBookingStatus(booking.status)} | {formatBookingStatus(booking.paymentStatus)}
                        </p>
                      </div>
                      <p className="text-xs uppercase tracking-wide text-noir-muted">
                        {booking.bookingReference || booking._id.slice(-8).toUpperCase()} | {formatDateTime(booking.date, booking.time)} | {booking.guests} guests
                      </p>
                      <p className="text-xs uppercase tracking-wide text-noir-muted">
                        {booking.contactName || getUserDisplayName(buyer)} | {booking.phone || 'Phone unavailable'} | {booking.eventType}
                      </p>
                      {booking.eventLocation && (
                        <p className="text-xs uppercase tracking-wide text-noir-muted">Venue: {booking.eventLocation}</p>
                      )}
                      {booking.notes && (
                        <p className="text-xs uppercase tracking-wide text-noir-muted">Notes: {booking.notes}</p>
                      )}
                      {booking.transactionId && (
                        <p className="text-xs uppercase tracking-wide text-noir-muted">Transaction: {booking.transactionId}</p>
                      )}
                      {booking.paymentScreenshot && (
                        <a href={booking.paymentScreenshot} target="_blank" rel="noreferrer" className="inline-block text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">
                          View payment proof
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-xl font-display font-semibold text-noir-ink">{formatCurrency(booking.amount)}</p>
                      <div className="flex flex-wrap gap-3">
                        {booking.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusChange(booking._id, 'confirmed')} className="btn-noir !rounded-none !px-5 !py-3">
                              Confirm
                            </button>
                            <button onClick={() => handleStatusChange(booking._id, 'rejected')} className="btn-outline-noir !rounded-none !px-5 !py-3">
                              Reject
                            </button>
                          </>
                        )}
                        {['confirmed', 'accepted'].includes(booking.status) && (
                          <button onClick={() => handleStatusChange(booking._id, 'completed')} className="btn-noir !rounded-none !px-5 !py-3">
                            Mark completed
                          </button>
                        )}
                        {booking.paymentStatus === 'paid_pending_verification' && (
                          <button onClick={() => handleVerifyPayment(booking._id)} className="btn-outline-noir !rounded-none !px-5 !py-3">
                            Verify payment
                          </button>
                        )}
                        <button onClick={() => setChatBooking(booking)} className="btn-outline-noir !rounded-none !px-5 !py-3">
                          <span className="inline-flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="border border-dashed border-noir-border px-4 py-10 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                No bookings received yet.
              </div>
            )}
          </div>
        </section>

        <section className="border border-noir-border bg-noir-card p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">My services</h2>
              <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">Quick access to edit your live listings.</p>
            </div>
            <Link to="/dashboard/create-service" className="btn-noir !rounded-none !px-5 !py-3">Create service</Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {loading ? Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            )) : services.length > 0 ? services.map((service) => (
              <div key={service._id} className="flex items-center justify-between gap-4 border border-noir-border bg-noir-bg p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={service.images[0] || FALLBACK_IMAGE_URL}
                    alt={getServiceTitle(service)}
                    className="h-16 w-16 object-cover"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                    }}
                  />
                  <div>
                    <p className="text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">{getServiceTitle(service)}</p>
                    <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">{formatServicePrice(service.price)}</p>
                    <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-noir-muted">{formatPriceLabel(service.price, service.priceLabel)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/dashboard/edit-service/${service._id}`} className="btn-outline-noir !rounded-none !px-4 !py-3">Edit</Link>
                  <Link to={`/event/${service._id}`} className="btn-outline-noir !rounded-none !px-4 !py-3">View</Link>
                </div>
              </div>
            )) : (
              <div className="border border-dashed border-noir-border px-4 py-10 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted md:col-span-2">
                No services posted yet.
              </div>
            )}
          </div>
        </section>

        {chatBooking && (
          <ChatPanel
            bookingId={chatBooking._id}
            title={`Guest chat: ${getServiceTitle(typeof chatBooking.service === 'object' ? chatBooking.service : null)}`}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboard;
