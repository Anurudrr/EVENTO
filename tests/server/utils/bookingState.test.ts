import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertBookingStatusTransition,
  getPaymentStartError,
  getPaymentVerificationLockError,
  isInactiveBookingStatus,
} from '../../../server/utils/bookingState.ts';

describe('bookingState', () => {
  it('flags inactive booking statuses consistently', () => {
    assert.equal(isInactiveBookingStatus('cancelled'), true);
    assert.equal(isInactiveBookingStatus('rejected'), true);
    assert.equal(isInactiveBookingStatus('completed'), true);
    assert.equal(isInactiveBookingStatus('pending'), false);
  });

  it('blocks new payment attempts for inactive or already-verified bookings', () => {
    assert.equal(
      getPaymentStartError({ status: 'completed', paymentStatus: 'pending' }),
      'This booking can no longer be paid for',
    );
    assert.equal(
      getPaymentStartError({ status: 'pending', paymentStatus: 'verified' }),
      'Payment is already completed for this booking',
    );
    assert.equal(getPaymentStartError({ status: 'pending', paymentStatus: 'pending' }), '');
  });

  it('blocks payment verification for inactive bookings', () => {
    assert.equal(
      getPaymentVerificationLockError({ status: 'rejected' }),
      'This booking can no longer accept payment verification',
    );
    assert.equal(getPaymentVerificationLockError({ status: 'pending' }), '');
  });

  it('normalizes accepted transitions back to confirmed', () => {
    assert.equal(assertBookingStatusTransition('pending', 'accepted'), 'confirmed');
    assert.equal(assertBookingStatusTransition('rejected', 'confirmed'), 'confirmed');
  });

  it('rejects invalid lifecycle transitions', () => {
    assert.throws(
      () => assertBookingStatusTransition('cancelled', 'confirmed'),
      /Cancelled bookings cannot be updated/,
    );
    assert.throws(
      () => assertBookingStatusTransition('rejected', 'completed'),
      /Rejected bookings can only be moved back to confirmed/,
    );
    assert.throws(
      () => assertBookingStatusTransition('pending', 'completed'),
      /Only confirmed bookings can be marked as completed/,
    );
  });
});
