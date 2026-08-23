export type BookingStatus = 'pending' | 'confirmed' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type BookingPaymentStatus = 'pending' | 'failed' | 'paid_pending_verification' | 'verified';
export type BookingStatusTransitionTarget = 'accepted' | 'confirmed' | 'rejected' | 'completed';

const INACTIVE_BOOKING_STATUS_SET = new Set<BookingStatus>(['cancelled', 'rejected', 'completed']);

export const isInactiveBookingStatus = (status: unknown): status is 'cancelled' | 'rejected' | 'completed' => (
  typeof status === 'string' && INACTIVE_BOOKING_STATUS_SET.has(status as BookingStatus)
);

export const getPaymentStartError = (booking: { status?: unknown; paymentStatus?: unknown }) => {
  if (isInactiveBookingStatus(booking.status)) {
    return 'This booking can no longer be paid for';
  }

  if (booking.paymentStatus === 'verified') {
    return 'Payment is already completed for this booking';
  }

  return '';
};

export const getPaymentVerificationLockError = (booking: { status?: unknown }) => (
  isInactiveBookingStatus(booking.status)
    ? 'This booking can no longer accept payment verification'
    : ''
);

export const assertBookingStatusTransition = (
  currentStatus: unknown,
  nextStatus: BookingStatusTransitionTarget,
) => {
  const targetStatus = nextStatus === 'accepted' ? 'confirmed' : nextStatus;

  if (currentStatus === 'cancelled') {
    throw new Error('Cancelled bookings cannot be updated');
  }

  if (currentStatus === 'rejected' && targetStatus !== 'confirmed') {
    throw new Error('Rejected bookings can only be moved back to confirmed');
  }

  if (targetStatus === 'completed' && !['confirmed', 'accepted'].includes(String(currentStatus || ''))) {
    throw new Error('Only confirmed bookings can be marked as completed');
  }

  return targetStatus;
};
