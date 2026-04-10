import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BriefcaseBusiness, CalendarDays, CreditCard, Shield, Trash2, Users } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import { AdminOverview, PaymentRecord, Service } from '../types';
import {
  FALLBACK_IMAGE_URL,
  formatBookingStatus,
  formatCurrency,
  formatDate,
  formatServicePrice,
  getErrorMessage,
  getServiceLocation,
  getServiceTitle,
  getUserDisplayName,
} from '../utils';
import { Skeleton } from '../components/ui/Skeleton';

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};

const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPaymentId, setProcessingPaymentId] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOverview();
      setOverview(data);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to load admin dashboard'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const updatePaymentState = (payment?: PaymentRecord, bookingId?: string, booking?: AdminOverview['bookings'][number]) => {
    if (!payment && !booking) {
      return;
    }

    setOverview((current) => current ? {
      ...current,
      payments: payment
        ? current.payments.map((item) => item._id === payment._id ? payment : item)
        : current.payments,
      bookings: booking
        ? current.bookings.map((item) => item._id === booking._id ? booking : item)
        : bookingId
          ? current.bookings.map((item) => item._id === bookingId ? { ...item, paymentStatus: payment?.status === 'confirmed' ? 'verified' : 'failed' } : item)
          : current.bookings,
    } : current);
  };

  const handleDeleteService = async (service: Service) => {
    try {
      await adminService.deleteService(service._id);
      setOverview((current) => current ? {
        ...current,
        summary: {
          ...current.summary,
          services: Math.max(0, current.summary.services - 1),
        },
        services: current.services.filter((item) => item._id !== service._id),
      } : current);
      showToast('Service removed', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to remove service'), 'error');
    }
  };

  const handleApprovePayment = async (payment: PaymentRecord) => {
    setProcessingPaymentId(payment._id);
    try {
      const result = await adminService.approvePayment(payment._id);
      updatePaymentState(result.payment, result.booking?._id, result.booking);
      showToast('Payment approved', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to approve payment'), 'error');
    } finally {
      setProcessingPaymentId('');
    }
  };

  const handleRejectPayment = async (payment: PaymentRecord) => {
    setProcessingPaymentId(payment._id);
    try {
      const result = await adminService.rejectPayment(payment._id);
      updatePaymentState(result.payment, result.booking?._id, result.booking);
      showToast('Payment rejected', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to reject payment'), 'error');
    } finally {
      setProcessingPaymentId('');
    }
  };

  const stats = overview ? [
    { label: 'Users', value: overview.summary.users, icon: Users },
    { label: 'Organizers', value: overview.summary.organizers, icon: Shield },
    { label: 'Services', value: overview.summary.services, icon: BriefcaseBusiness },
    { label: 'Bookings', value: overview.summary.bookings, icon: CalendarDays },
    { label: 'Payments', value: overview.summary.payments, icon: CreditCard },
  ] : [];

  const pendingPayments = useMemo(
    () => overview?.payments.filter((payment) => payment.status === 'pending') || [],
    [overview?.payments],
  );

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">Admin dashboard</h1>
          <p className="mt-3 text-sm uppercase tracking-wide text-noir-muted">
            Monitor marketplace activity, moderate services, and verify UPI payment submissions.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-36" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} className="border border-noir-border bg-noir-card p-8" {...reveal} transition={{ ...reveal.transition, delay: index * 0.04 }}>
                <stat.icon className="h-6 w-6 text-noir-accent" />
                <p className="mt-4 text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-muted">{stat.label}</p>
                <p className="mt-3 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        <motion.section className="border border-noir-border bg-noir-card p-8" {...reveal}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">Payment verification queue</h2>
              <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">
                Review UTR submissions and push bookings from pending to confirmed.
              </p>
            </div>
            <div className="border border-noir-border bg-noir-bg px-4 py-3 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">
              {pendingPayments.length} pending review
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40" />)
            ) : overview?.payments.length ? overview.payments.slice(0, 12).map((payment) => {
              const service = typeof payment.service === 'object' ? payment.service : null;
              const buyer = typeof payment.user === 'object' ? payment.user : null;
              const booking = typeof payment.booking === 'object' ? payment.booking : null;
              const isBusy = processingPaymentId === payment._id;

              return (
                <motion.div key={payment._id} className="border border-noir-border bg-noir-bg p-6" {...reveal}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <p className="text-lg font-display font-semibold uppercase tracking-wide text-noir-ink">{getServiceTitle(service)}</p>
                        <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">
                          {formatBookingStatus(payment.status)} / {booking ? formatBookingStatus(booking.paymentStatus) : 'Booking pending'}
                        </p>
                      </div>
                      <p className="text-xs uppercase tracking-wide text-noir-muted">
                        Buyer: {getUserDisplayName(buyer)} | UTR: {payment.utr || 'Not submitted'}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-noir-muted">
                        Order {payment.orderId} | Submitted {formatDate(payment.submittedAt || payment.createdAt || '')}
                      </p>
                      {payment.rejectionReason && (
                        <p className="text-xs uppercase tracking-wide text-rose-500">Note: {payment.rejectionReason}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-2xl font-display font-semibold text-noir-ink">{formatCurrency(payment.amount)}</p>
                      <div className="flex flex-wrap gap-3">
                        {payment.status === 'pending' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => void handleApprovePayment(payment)}
                              disabled={isBusy}
                              className="btn-noir !rounded-none !px-5 !py-3"
                            >
                              {isBusy ? 'Updating...' : 'Approve'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => void handleRejectPayment(payment)}
                              disabled={isBusy}
                              className="btn-outline-noir !rounded-none !px-5 !py-3"
                            >
                              Reject
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="border border-dashed border-noir-border px-4 py-8 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                No payment submissions found.
              </div>
            )}
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <motion.div className="border border-noir-border bg-noir-card p-8" {...reveal}>
            <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">Users</h2>
            <div className="mt-6 space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)
              ) : overview?.users.length ? overview.users.map((user) => (
                <div key={user._id} className="border border-noir-border bg-noir-bg px-5 py-4">
                  <p className="text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">{getUserDisplayName(user)}</p>
                  <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">{user.role}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{user.email}</p>
                </div>
              )) : (
                <div className="border border-dashed border-noir-border px-4 py-8 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                  No users found.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div className="border border-noir-border bg-noir-card p-8" {...reveal}>
            <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">Services</h2>
            <div className="mt-6 space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)
              ) : overview?.services.length ? overview.services.map((service) => (
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
                      <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{getServiceLocation(service)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleDeleteService(service)}
                    className="text-rose-500 transition-colors hover:text-rose-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )) : (
                <div className="border border-dashed border-noir-border px-4 py-8 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                  No services found.
                </div>
              )}
            </div>
          </motion.div>
        </section>

        <motion.section className="border border-noir-border bg-noir-card p-8" {...reveal}>
          <h2 className="text-xl font-display font-semibold uppercase tracking-wide text-noir-ink">Recent bookings</h2>
          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)
            ) : overview?.bookings.length ? overview.bookings.slice(0, 10).map((booking) => {
              const service = typeof booking.service === 'object' ? booking.service : null;
              const user = typeof booking.user === 'object' ? booking.user : null;

              return (
                <div key={booking._id} className="border border-noir-border bg-noir-bg px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">
                        {getServiceTitle(service)} by {getUserDisplayName(user)}
                      </p>
                      <p className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">
                        {formatBookingStatus(booking.status)} | {formatBookingStatus(booking.paymentStatus)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">{formatCurrency(booking.amount)}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{formatDate(booking.date)} at {booking.time}</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="border border-dashed border-noir-border px-4 py-8 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                No bookings found.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
