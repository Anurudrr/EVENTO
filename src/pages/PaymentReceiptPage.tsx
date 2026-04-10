import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, Download, ReceiptIndianRupee } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useToast } from '../context/ToastContext';
import { PaymentReceipt } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getErrorMessage,
  getServiceTitle,
  getUserDisplayName,
} from '../utils';

const PaymentReceiptPage: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const { showToast } = useToast();
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await bookingService.getPaymentReceipt(orderId);
        setReceipt(data);
      } catch (error) {
        showToast(getErrorMessage(error, 'Unable to load the payment receipt'), 'error');
      } finally {
        setLoading(false);
      }
    };

    void loadReceipt();
  }, [orderId, showToast]);

  if (loading) {
    return (
      <main className="min-h-screen bg-noir-bg px-6 pb-24 pt-32">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[36rem] w-full" />
        </div>
      </main>
    );
  }

  if (!receipt) {
    return (
      <main className="min-h-screen bg-noir-bg px-6 pb-24 pt-32">
        <div className="container mx-auto max-w-3xl border border-dashed border-noir-border bg-noir-card px-6 py-16 text-center">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Receipt unavailable</p>
          <h1 className="mt-4 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">This receipt could not be found</h1>
          <Link to="/dashboard/buyer" className="btn-noir mx-auto mt-8 w-fit !rounded-none !px-6 !py-4">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const service = typeof receipt.service === 'object' ? receipt.service : null;
  const booking = receipt.booking;
  const buyer = typeof receipt.user === 'object' ? receipt.user : (typeof booking.user === 'object' ? booking.user : null);

  return (
    <main className="min-h-screen bg-noir-bg px-6 pb-24 pt-32">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/dashboard/buyer" className="inline-flex items-center gap-3 text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.print()}
            className="btn-outline-noir w-fit !rounded-none !px-5 !py-3"
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download receipt
            </span>
          </motion.button>
        </div>

        <motion.section
          className="overflow-hidden border border-noir-border bg-noir-card shadow-[0_30px_80px_rgba(0,0,0,0.08)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="border-b border-noir-border bg-noir-bg px-6 py-8 md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Payment receipt</p>
                <h1 className="mt-4 text-4xl font-display font-semibold uppercase tracking-wide text-noir-ink">Booking paid</h1>
                <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">
                  Order {receipt.orderId} confirmed on {formatDate(receipt.confirmedAt || receipt.paidAt || receipt.createdAt || '')}
                </p>
              </div>
              <div className="inline-flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-emerald-600">
                <BadgeCheck className="h-4 w-4" />
                Status paid
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-10">
            <div className="space-y-6">
              <div className="border border-noir-border bg-noir-bg p-5">
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Service</p>
                <p className="mt-3 text-2xl font-display font-semibold uppercase tracking-wide text-noir-ink">
                  {getServiceTitle(service)}
                </p>
                <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">
                  Booking ref {booking.bookingReference || booking._id.slice(-8).toUpperCase()}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-noir-border bg-noir-bg p-5">
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Client</p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-noir-ink">{getUserDisplayName(buyer)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{booking.phone || 'Phone pending'}</p>
                </div>
                <div className="border border-noir-border bg-noir-bg p-5">
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Event</p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-noir-ink">{booking.eventType}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{formatDateTime(booking.date, booking.time)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 border border-noir-border bg-noir-bg p-6">
              <div className="flex items-center gap-3 text-noir-accent">
                <ReceiptIndianRupee className="h-5 w-5" />
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em]">Receipt summary</p>
              </div>

              <div className="space-y-4 border-t border-noir-border pt-4">
                <div className="flex items-center justify-between gap-4 text-sm uppercase tracking-wide text-noir-muted">
                  <span>Amount</span>
                  <span className="font-display text-2xl font-semibold text-noir-ink">{formatCurrency(receipt.amount)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-wide text-noir-muted">
                  <span>UTR</span>
                  <span className="font-mono font-semibold text-noir-ink">{receipt.utr || 'Pending'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-wide text-noir-muted">
                  <span>Paid on</span>
                  <span className="font-semibold text-noir-ink">{formatDate(receipt.paidAt || receipt.createdAt || '')}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-wide text-noir-muted">
                  <span>Confirmed on</span>
                  <span className="font-semibold text-noir-ink">{formatDate(receipt.confirmedAt || receipt.paidAt || receipt.createdAt || '')}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-wide text-noir-muted">
                  <span>Order ID</span>
                  <span className="font-mono font-semibold text-noir-ink">{receipt.orderId}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default PaymentReceiptPage;
