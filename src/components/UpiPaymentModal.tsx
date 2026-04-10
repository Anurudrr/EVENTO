import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Copy,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { useToast } from '../context/ToastContext';
import { Booking, PaymentSession, Service } from '../types';
import {
  formatBookingStatus,
  formatCurrency,
  formatDateTime,
  getErrorMessage,
  getServiceTitle,
} from '../utils';

interface UpiPaymentModalProps {
  open: boolean;
  booking: Booking | null;
  service: Service | null;
  onClose: () => void;
  onPaid: (booking: Booking) => void;
}

const formatTimer = (seconds: number) => {
  const normalized = Math.max(0, seconds);
  const minutes = Math.floor(normalized / 60);
  const remainder = normalized % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  open,
  booking,
  service,
  onClose,
  onPaid,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const terminalStatusRef = useRef('');
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [utr, setUtr] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loadingSession, setLoadingSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [successState, setSuccessState] = useState(false);

  const serviceTitle = useMemo(
    () => session?.serviceTitle || getServiceTitle(service),
    [service, session?.serviceTitle],
  );

  const loadPaymentSession = async () => {
    if (!booking) {
      return;
    }

    setLoadingSession(true);
    setStatusError('');

    try {
      const nextSession = await bookingService.createUpiPaymentSession(booking._id);
      terminalStatusRef.current = '';
      setSession(nextSession);
      setUtr(nextSession.payment?.utr || '');
      setSuccessState(false);

      if (nextSession.status === 'rejected' && nextSession.rejectionReason) {
        setStatusMessage('');
        setStatusError(nextSession.rejectionReason);
      } else if (nextSession.submittedAt) {
        setStatusMessage('Payment submitted. We are checking its verification status.');
      } else {
        setStatusMessage('Scan the QR code or open your UPI app, then submit the transaction ID below.');
      }
    } catch (error) {
      setStatusMessage('');
      setStatusError(getErrorMessage(error, 'Unable to start the payment session right now.'));
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    if (!open) {
      terminalStatusRef.current = '';
      setSession(null);
      setUtr('');
      setQrCodeDataUrl('');
      setLoadingSession(false);
      setSubmitting(false);
      setStatusMessage('');
      setStatusError('');
      setSecondsLeft(0);
      setSuccessState(false);
      return;
    }

    if (booking) {
      void loadPaymentSession();
    }
  }, [open, booking?._id]);

  useEffect(() => {
    if (!session?.upiLink) {
      setQrCodeDataUrl('');
      return;
    }

    let isMounted = true;

    void QRCode.toDataURL(session.upiLink, {
      width: 360,
      margin: 1,
      color: {
        dark: '#171717',
        light: '#FFFFFF',
      },
    }).then((value) => {
      if (isMounted) {
        setQrCodeDataUrl(value);
      }
    }).catch(() => {
      if (isMounted) {
        setQrCodeDataUrl('');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [session?.upiLink]);

  useEffect(() => {
    if (!open || !session?.expiresAt || session.submittedAt || session.status !== 'pending') {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(session.expiresAt || '').getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);

      if (diff === 0) {
        setStatusMessage('');
        setStatusError('This QR code has expired. Generate a fresh one to continue.');
      }
    };

    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [open, session?.expiresAt, session?.submittedAt, session?.status]);

  useEffect(() => {
    if (!open || !booking || !session?.orderId || !session.submittedAt || session.status !== 'pending') {
      return;
    }

    const pollStatus = async () => {
      try {
        const nextState = await bookingService.getUpiPaymentStatus(booking._id, session.orderId);

        setSession((current) => current ? {
          ...current,
          status: nextState.payment.status,
          rejectionReason: nextState.payment.rejectionReason || '',
          submittedAt: nextState.payment.submittedAt || current.submittedAt,
          payment: nextState.payment,
        } : current);

        onPaid(nextState.booking);

        if (nextState.payment.status === 'confirmed' && terminalStatusRef.current !== 'confirmed') {
          terminalStatusRef.current = 'confirmed';
          setStatusError('');
          setStatusMessage('Payment confirmed. Opening your receipt.');
          setSuccessState(true);
          showToast('Payment confirmed', 'success');

          window.setTimeout(() => {
            onClose();
            navigate(`/receipt/${nextState.payment.orderId}`);
          }, 1400);
        }

        if (nextState.payment.status === 'rejected' && terminalStatusRef.current !== 'rejected') {
          terminalStatusRef.current = 'rejected';
          setSuccessState(false);
          setStatusMessage('');
          setStatusError(nextState.payment.rejectionReason || 'Payment was rejected. Generate a fresh QR and try again.');
          showToast(nextState.payment.rejectionReason || 'Payment rejected', 'error');
        }
      } catch (error) {
        console.error('[upi-payment:poll-status]', error);
      }
    };

    void pollStatus();
    const interval = window.setInterval(() => {
      void pollStatus();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [open, booking?._id, session?.orderId, session?.submittedAt, session?.status, navigate, onClose, onPaid, showToast]);

  if (!booking || !service) {
    return null;
  }

  const handleCopy = async (value: string, label: string) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied`, 'success');
    } catch {
      showToast(`Unable to copy ${label.toLowerCase()}`, 'error');
    }
  };

  const handleSubmitPayment = async () => {
    if (!booking || !session) {
      return;
    }

    if (!utr.trim() || utr.trim().length < 8) {
      setStatusMessage('');
      setStatusError('Enter a valid UTR or transaction ID to continue.');
      return;
    }

    if (!session.submittedAt && secondsLeft === 0) {
      setStatusMessage('');
      setStatusError('This QR code has expired. Generate a fresh one before submitting payment.');
      return;
    }

    setSubmitting(true);
    setStatusError('');

    try {
      const nextState = await bookingService.submitUpiPayment(booking._id, {
        orderId: session.orderId,
        utr: utr.trim(),
      });

      setSession((current) => current ? {
        ...current,
        status: nextState.payment.status,
        rejectionReason: nextState.payment.rejectionReason || '',
        submittedAt: nextState.payment.submittedAt || current.submittedAt,
        payment: nextState.payment,
      } : current);
      setStatusMessage('Payment submitted. We are checking its verification status.');
      onPaid(nextState.booking);
      showToast('Payment submitted for verification', 'success');
    } catch (error) {
      setStatusMessage('');
      setStatusError(getErrorMessage(error, 'Unable to submit your transaction ID.'));
      showToast(getErrorMessage(error, 'Unable to submit your transaction ID.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-noir-ink/78 px-4 py-6 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            data-lenis-prevent
            className="relative w-full max-w-5xl overflow-hidden border border-white/50 bg-white/78 shadow-[0_40px_140px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,163,115,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(14,18,28,0.08),transparent_32%)]" />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center border border-white/60 bg-white/80 text-noir-muted hover:text-noir-ink"
              aria-label="Close payment modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="border-b border-noir-border/70 bg-[#fbf7f1]/72 p-6 md:p-8 lg:border-b-0 lg:border-r">
                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">UPI QR checkout</p>
                <h3 className="mt-4 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink md:text-4xl">
                  Finish the payment in your UPI app
                </h3>
                <p className="mt-3 max-w-xl text-xs uppercase tracking-wide text-noir-muted md:text-sm">
                  Scan the QR code, pay the organizer directly, then submit the UTR so EVENTO can confirm the booking.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="border border-noir-border bg-noir-card p-5">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Service</p>
                    <p className="mt-2 text-lg font-display font-semibold uppercase tracking-wide text-noir-ink">{serviceTitle}</p>
                    <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">
                      {booking.bookingReference || booking._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="border border-noir-border bg-noir-card p-5">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Amount</p>
                    <p className="mt-2 text-3xl font-display font-semibold text-noir-ink">{formatCurrency(booking.amount)}</p>
                    <p className="mt-3 text-xs uppercase tracking-wide text-noir-muted">
                      {formatDateTime(booking.date, booking.time)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="border border-noir-border bg-noir-card p-5">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Guest contact</p>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">{booking.contactName}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{booking.phone || 'Phone pending'}</p>
                  </div>
                  <div className="border border-noir-border bg-noir-card p-5">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Booking status</p>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">
                      {formatBookingStatus(booking.status)} / {formatBookingStatus(booking.paymentStatus)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{booking.eventType}</p>
                  </div>
                </div>

                {(statusMessage || statusError) && (
                  <motion.div
                    className={`mt-6 border px-5 py-4 text-xs font-mono font-semibold uppercase tracking-[0.25em] ${
                      statusError
                        ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                        : 'border-noir-accent/20 bg-noir-accent/10 text-noir-accent'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start gap-3">
                      {statusError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}
                      <span>{statusError || statusMessage}</span>
                    </div>
                  </motion.div>
                )}

                {booking.paymentFailureReason && !statusError && (
                  <div className="mt-4 border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-xs font-mono font-semibold uppercase tracking-[0.25em] text-amber-500">
                    Last review note: {booking.paymentFailureReason}
                  </div>
                )}

                <div className="mt-8 border border-noir-border bg-noir-card p-5">
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Transaction ID / UTR</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">
                    After completing the transfer, paste the transaction reference from your UPI app.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={utr}
                      onChange={(event) => setUtr(event.target.value)}
                      placeholder="Enter UTR or transaction ID"
                      className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-sm uppercase tracking-wide text-noir-ink focus:border-noir-accent focus:outline-none"
                      disabled={submitting || successState}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSubmitPayment}
                      disabled={submitting || loadingSession || successState || !session}
                      className="btn-noir min-w-[13rem] !rounded-none !px-6 !py-4"
                    >
                      {submitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <CheckCheck className="h-4 w-4" />
                          Submit Payment
                        </span>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="relative bg-white/48 p-6 md:p-8 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,163,115,0.12),transparent_40%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Payment session</p>
                      <h4 className="mt-3 text-2xl font-display font-semibold uppercase tracking-wide text-noir-ink">Scan and pay</h4>
                    </div>
                    <div className="border border-noir-border bg-noir-bg px-4 py-3 text-right">
                      <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">Timer</p>
                      <p className="mt-2 font-mono text-lg font-semibold tracking-[0.2em] text-noir-ink">
                        {session?.submittedAt ? 'LIVE' : formatTimer(secondsLeft)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden border border-noir-border bg-noir-bg p-5">
                    <div className="relative flex min-h-[22rem] items-center justify-center border border-noir-border bg-white p-4">
                      {loadingSession ? (
                        <div className="flex flex-col items-center gap-3 text-noir-muted">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em]">Preparing QR</span>
                        </div>
                      ) : successState ? (
                        <motion.div
                          className="flex flex-col items-center justify-center gap-4 text-center text-noir-ink"
                          initial={{ opacity: 0, scale: 0.86 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                        >
                          <motion.div
                            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.4 }}
                          >
                            <Check className="h-10 w-10" />
                          </motion.div>
                          <div>
                            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-emerald-600">Confirmed</p>
                            <p className="mt-3 text-2xl font-display font-semibold uppercase tracking-wide">Payment received</p>
                          </div>
                        </motion.div>
                      ) : qrCodeDataUrl ? (
                        <motion.img
                          src={qrCodeDataUrl}
                          alt={`UPI payment QR for ${serviceTitle}`}
                          className="h-full w-full max-w-[18rem] object-contain"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-noir-muted">
                          <QrCode className="h-10 w-10" />
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em]">QR unavailable</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between gap-3 border border-noir-border bg-white px-4 py-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">UPI ID</p>
                          <p className="mt-2 truncate text-sm font-semibold uppercase tracking-wide text-noir-ink">{session?.upiId || 'Not available'}</p>
                        </div>
                        <button onClick={() => void handleCopy(session?.upiId || '', 'UPI ID')} className="btn-outline-noir !rounded-none !px-4 !py-3">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 border border-noir-border bg-white px-4 py-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-accent">Order ID</p>
                          <p className="mt-2 truncate text-sm font-semibold uppercase tracking-wide text-noir-ink">{session?.orderId || 'Pending'}</p>
                        </div>
                        <button onClick={() => void handleCopy(session?.orderId || '', 'Order ID')} className="btn-outline-noir !rounded-none !px-4 !py-3">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <a
                        href={session?.upiLink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn-noir !rounded-none !py-4 ${session?.upiLink ? '' : 'pointer-events-none opacity-50'}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Open UPI App
                        </span>
                      </a>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => void loadPaymentSession()}
                        disabled={loadingSession || submitting}
                        className="btn-outline-noir !rounded-none !py-4"
                      >
                        <span className="inline-flex items-center gap-2">
                          <RefreshCw className={`h-4 w-4 ${loadingSession ? 'animate-spin' : ''}`} />
                          Generate Fresh QR
                        </span>
                      </motion.button>
                    </div>

                    <div className="mt-5 space-y-3 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
                      <div className="flex items-center gap-3 border border-noir-border bg-white px-4 py-4">
                        <Wallet className="h-4 w-4 text-noir-accent" />
                        Pay {formatCurrency(session?.amount || booking.amount)} to the organizer UPI account.
                      </div>
                      <div className="flex items-center gap-3 border border-noir-border bg-white px-4 py-4">
                        <ShieldCheck className="h-4 w-4 text-noir-accent" />
                        Submit the UTR after payment so EVENTO can confirm your booking.
                      </div>
                      <div className="flex items-center gap-3 border border-noir-border bg-white px-4 py-4">
                        <CheckCheck className="h-4 w-4 text-noir-accent" />
                        Status refreshes automatically every 5 seconds after submission.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
