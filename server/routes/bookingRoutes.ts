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
  requestBookingRefund,
  createBookingDispute,
} from '../controllers/bookingController.ts';
import {
  createRazorpayOrder,
  createUpiPaymentSession,
  getUpiPaymentReceipt,
  getUpiPaymentStatus,
  recordBookingPaymentFailure,
  submitUpiPayment,
  verifyRazorpayPaymentForBooking,
} from '../controllers/paymentController.ts';
import { protect, requireOrganizer } from '../middleware/authMiddleware.ts';
import {
  validateBooking,
  validateBookingPayment,
  validateRazorpayVerification,
  validateUpiPaymentSubmission,
  validateBookingStatus,
  validatePaymentFailure,
  validateRefundRequest,
  validateDisputeRequest,
} from '../middleware/validationMiddleware.ts';
import { checkImageFile } from '../utils/upload.ts';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    checkImageFile(file, cb);
  },
});

router.use(protect);

router.route('/').post(validateBooking, createBooking);
router.get('/user', getMyBookings);
router.get('/my', getMyBookings);
router.get('/mybookings', getMyBookings);
router.get('/organizer', requireOrganizer, getOrganizerBookings);
router.get('/payment/receipt/:orderId', getUpiPaymentReceipt);
router.post('/:id/payment/razorpay/order', createRazorpayOrder);
router.post('/:id/payment/razorpay/verify', validateRazorpayVerification, verifyRazorpayPaymentForBooking);
router.post('/:id/payment/order', createUpiPaymentSession);
router.post('/:id/payment/submit', validateUpiPaymentSubmission, submitUpiPayment);
router.get('/:id/payment/status', getUpiPaymentStatus);
router.post('/:id/payment/failure', validatePaymentFailure, recordBookingPaymentFailure);
router.post('/:id/refund-request', validateRefundRequest, requestBookingRefund);
router.post('/:id/disputes', validateDisputeRequest, createBookingDispute);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/pay', upload.single('screenshot'), validateBookingPayment, markBookingPaid);
router.put('/:id/verify', requireOrganizer, verifyPayment);
router.put('/:id/status', requireOrganizer, validateBookingStatus, updateBookingStatus);
router.delete('/:id', cancelBooking);

export default router;
