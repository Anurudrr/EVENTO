import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Heart, MessageSquare, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { bookingService } from '../services/bookingService';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { Booking, Service } from '../types';
import { ChatPanel } from '../components/ChatPanel';
import { UpiPaymentModal } from '../components/UpiPaymentModal';
import { Skeleton } from '../components/ui/Skeleton';
import {
  formatBookingStatus,
  formatCurrency,
  formatDateTime,
  formatServicePrice,
  getErrorMessage,
  getServiceLocation,
  getServiceTitle,
} from '../utils';

const BuyerDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bookingData, wishlistData] = await Promise.all([
        bookingService.getMyBookings(),
        userService.getWishlist(),
      ]);
      setBookings(bookingData);
      setWishlist(wishlistData);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to load your dashboard'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalSpent = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === 'verified').reduce((sum, booking) => sum + booking.amount, 0),
    [bookings],
  );

  const stats = [
    { label: 'Bookings', value: bookings.length, icon: Calendar },
    { label: 'Saved', value: wishlist.length, icon: Heart },
    { label: 'Paid', value: formatCurrency(totalSpent), icon: Wallet },
  ];

  const handleCancel = async (bookingId: string) => {
    try {
      const updated = await bookingService.cancelBooking(bookingId);
      setBookings((current) => current.map((booking) => booking._id === bookingId ? updated : booking));
      showToast('Booking cancelled', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to cancel booking'), 'error');
    }
  };

  const handlePaymentSuccess = (updatedBooking: Booking) => {
    setBookings((current) => current.map((booking) => booking._id === updatedBooking._id ? updatedBooking : booking));
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">Buyer dashboard</h1>
          <p className="mt-3 text-sm uppercase tracking-wide text-noir-muted">
            Track your bookings, payment verification, chat history, and saved services.
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

        <section className="border border-noir-border bg-noir-card p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">My bookings</h2>
              <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">Status, payment proof, and organizer messages in one place.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            )) : bookings.length > 0 ? bookings.map((booking) => {
              const service = typeof booking.service === 'object' ? booking.service as Service : null;
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
                        {booking.bookingReference || booking._id.slice(-8).toUpperCase()} | {formatDateTime(booking.date, booking.time)}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-noir-muted">
                        {booking.eventType} | {booking.guests} guests | {booking.contactName}
                      </p>
                      {booking.phone && (
                        <p className="text-xs uppercase tracking-wide text-noir-muted">Phone: {booking.phone}</p>
                      )}
                      {booking.eventLocation && (
                        <p className="text-xs uppercase tracking-wide text-noir-muted">Venue: {booking.eventLocation}</p>
                      )}
                      {booking.notes && (
                        <p className="text-xs uppercase tracking-wide text-noir-muted">Notes: {booking.notes}</p>
                      )}
                      {booking.transactionId && (
                        <p className="text-xs uppercase tracking-wide text-noir-muted">Transaction: {booking.transactionId}</p>
                      )}
                      {booking.paymentFailureReason && (
                        <p className="text-xs uppercase tracking-wide text-amber-400">Payment issue: {booking.paymentFailureReason}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-xl font-display font-semibold text-noir-ink">{formatCurrency(booking.amount)}</p>
                      <div className="flex flex-wrap gap-3">
                        {['pending', 'failed'].includes(booking.paymentStatus) && !['cancelled', 'rejected'].includes(booking.status) && (
                          <button onClick={() => setPaymentBooking(booking)} className="btn-noir !rounded-none !px-5 !py-3">
                            Pay now
                          </button>
                        )}
                        {booking.paymentStatus === 'verified' && booking.paymentOrderId && (
                          <Link to={`/receipt/${booking.paymentOrderId}`} className="btn-outline-noir !rounded-none !px-5 !py-3">
                            View receipt
                          </Link>
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <button onClick={() => handleCancel(booking._id)} className="btn-outline-noir !rounded-none !px-5 !py-3">
                            Cancel
                          </button>
                        )}
                        <button onClick={() => setChatBooking(booking)} className="btn-outline-noir !rounded-none !px-5 !py-3">
                          <span className="inline-flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </span>
                        </button>
                        {booking.status === 'completed' && service?._id && (
                          <Link to={`/event/${service._id}`} className="btn-outline-noir !rounded-none !px-5 !py-3">
                            Review service
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="border border-dashed border-noir-border px-4 py-10 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                No bookings yet.
              </div>
            )}
          </div>
        </section>

        <section className="border border-noir-border bg-noir-card p-8">
          <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">Saved services</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {loading ? Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-36 w-full" />
            )) : wishlist.length > 0 ? wishlist.map((service) => (
              <Link key={service._id} to={`/event/${service._id}`} className="border border-noir-border bg-noir-bg p-5 transition-colors hover:border-noir-accent">
                <p className="text-lg font-display font-semibold uppercase tracking-wide text-noir-ink">{getServiceTitle(service)}</p>
                <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">{service.category || 'General'}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">{getServiceLocation(service)}</p>
                <p className="mt-3 text-sm font-display font-semibold text-noir-ink">{formatServicePrice(service.price)}</p>
              </Link>
            )) : (
              <div className="border border-dashed border-noir-border px-4 py-10 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted md:col-span-2">
                No saved services yet.
              </div>
            )}
          </div>
        </section>

        {chatBooking && (
          <ChatPanel
            bookingId={chatBooking._id}
            title={`Booking chat: ${getServiceTitle(typeof chatBooking.service === 'object' ? chatBooking.service : null)}`}
          />
        )}

        <UpiPaymentModal
          open={Boolean(paymentBooking)}
          booking={paymentBooking}
          service={paymentBooking && typeof paymentBooking.service === 'object' ? paymentBooking.service : null}
          onClose={() => setPaymentBooking(null)}
          onPaid={handlePaymentSuccess}
        />
      </div>
    </DashboardLayout>
  );
};

export default BuyerDashboard;
