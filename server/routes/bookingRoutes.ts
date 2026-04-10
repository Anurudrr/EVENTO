import express from 'express';
import multer from 'multer';
import {
  createBooking,
  getMyBookings,
  getOrganizerBookings,
  cancelBooking,
  markBookingPaid,
  verifyPayment,
  updateBookingStatus,
} from '../controllers/bookingController.ts';
import {
  createUpiPaymentSession,
  getUpiPaymentReceipt,
  getUpiPaymentStatus,
  recordBookingPaymentFailure,
  submitUpiPayment,
} from '../controllers/paymentController.ts';
import { protect, requireOrganizer } from '../middleware/authMiddleware.ts';
import {
  validateBooking,
  validateBookingPayment,
  validateUpiPaymentSubmission,
  validateBookingStatus,
  validatePaymentFailure,
} from '../middleware/validationMiddleware.ts';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.use(protect);

router.route('/').post(validateBooking, createBooking);
router.get('/user', getMyBookings);
router.get('/my', getMyBookings);
router.get('/mybookings', getMyBookings);
router.get('/organizer', requireOrganizer, getOrganizerBookings);
router.get('/payment/receipt/:orderId', getUpiPaymentReceipt);
router.post('/:id/payment/order', createUpiPaymentSession);
router.post('/:id/payment/submit', validateUpiPaymentSubmission, submitUpiPayment);
router.get('/:id/payment/status', getUpiPaymentStatus);
router.post('/:id/payment/failure', validatePaymentFailure, recordBookingPaymentFailure);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/pay', upload.single('screenshot'), validateBookingPayment, markBookingPaid);
router.put('/:id/verify', requireOrganizer, verifyPayment);
router.put('/:id/status', requireOrganizer, validateBookingStatus, updateBookingStatus);
router.delete('/:id', cancelBooking);

export default router;
