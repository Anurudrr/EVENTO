import {
  AdminOverview,
  AvailabilityEntry,
  Booking,
  ChatMessage,
  NotificationItem,
  PaymentReceipt,
  PaymentRecord,
  Review,
  Service,
  User,
} from '../types';
import {
  DEFAULT_SERVICE_DESCRIPTION,
  DEFAULT_SERVICE_LOCATION,
  DEFAULT_SERVICE_TITLE,
  DEFAULT_USER_BIO,
  DEFAULT_USER_NAME,
  getProfileImageUrl,
  getSafeText,
  getServiceImageUrls,
} from '../utils';

const getRawImageList = (service: any) => {
  if (!Array.isArray(service?.images)) {
    return [] as string[];
  }

  return service.images.filter((image: unknown): image is string => typeof image === 'string' && image.trim().length > 0);
};

export const normalizeUser = (user: any): User | undefined => {
  if (!user || typeof user !== 'object') return undefined;

  return {
    _id: user._id,
    name: getSafeText(user.name, DEFAULT_USER_NAME),
    email: getSafeText(user.email, ''),
    role: user.role || 'user',
    profilePicture: getProfileImageUrl(user),
    bio: getSafeText(user.bio, DEFAULT_USER_BIO),
    upiId: getSafeText(user.upiId, ''),
    createdAt: user.createdAt,
  };
};

export const normalizeAvailability = (entry: any): AvailabilityEntry => ({
  _id: entry?._id,
  date: entry?.date,
  isAvailable: Boolean(entry?.isAvailable),
  note: entry?.note || '',
});

export const normalizeService = (service: any): Service => ({
  _id: service._id,
  title: getSafeText(service?.title, DEFAULT_SERVICE_TITLE),
  description: getSafeText(service?.description, DEFAULT_SERVICE_DESCRIPTION),
  price: Number.isFinite(Number(service?.price)) ? Number(service.price) : 0,
  priceLabel: getSafeText(service?.priceLabel, ''),
  category: getSafeText(service?.category, 'General'),
  location: getSafeText(service?.location, DEFAULT_SERVICE_LOCATION),
  images: getServiceImageUrls(service),
  rawImages: getRawImageList(service),
  upiId: getSafeText(service?.upiId, ''),
  organizer: typeof service.organizer === 'object' ? normalizeUser(service.organizer)! : service.organizer,
  rating: Number(service.rating ?? 0),
  reviews: Number(service.reviews ?? 0),
  availability: Array.isArray(service.availability) ? service.availability.map(normalizeAvailability) : [],
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
});

export const normalizeBooking = (booking: any): Booking => ({
  _id: booking._id,
  orderId: booking.orderId || '',
  bookingReference: booking.bookingReference || '',
  service: typeof booking.service === 'object' ? normalizeService(booking.service) : booking.service,
  user: typeof booking.user === 'object' ? normalizeUser(booking.user)! : booking.user,
  organizer: typeof booking.organizer === 'object' ? normalizeUser(booking.organizer)! : booking.organizer,
  date: booking.date,
  contactName: booking.contactName || '',
  phone: booking.phone || '',
  eventType: booking.eventType || 'General Event',
  eventLocation: booking.eventLocation || '',
  time: booking.time || '',
  guests: Number(booking.guests ?? 1),
  notes: booking.notes || '',
  amount: Number(booking.amount ?? 0),
  currency: booking.currency || 'INR',
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  paymentProvider: booking.paymentProvider || 'none',
  paymentOrderId: booking.paymentOrderId || '',
  paymentId: booking.paymentId || '',
  paymentSignature: booking.paymentSignature || '',
  paymentFailureReason: booking.paymentFailureReason || '',
  upiIdUsed: booking.upiIdUsed,
  transactionId: booking.transactionId,
  paymentScreenshot: booking.paymentScreenshot,
  paidAt: booking.paidAt,
  createdAt: booking.createdAt,
});

export const normalizePayment = (payment: any): PaymentRecord => ({
  _id: payment?._id,
  orderId: getSafeText(payment?.orderId, ''),
  amount: Number(payment?.amount ?? 0),
  currency: getSafeText(payment?.currency, 'INR'),
  upiId: getSafeText(payment?.upiId, ''),
  utr: getSafeText(payment?.utr, ''),
  status: payment?.status || 'pending',
  rejectionReason: getSafeText(payment?.rejectionReason, ''),
  submittedAt: payment?.submittedAt,
  reviewedAt: payment?.reviewedAt,
  expiresAt: payment?.expiresAt,
  booking: typeof payment?.booking === 'object' ? normalizeBooking(payment.booking) : payment?.booking,
  service: typeof payment?.service === 'object' ? normalizeService(payment.service) : payment?.service,
  user: typeof payment?.user === 'object' ? normalizeUser(payment.user)! : payment?.user,
  organizer: typeof payment?.organizer === 'object' ? normalizeUser(payment.organizer)! : payment?.organizer,
  createdAt: payment?.createdAt,
  updatedAt: payment?.updatedAt,
});

export const normalizePaymentReceipt = (payload: any): PaymentReceipt => ({
  orderId: getSafeText(payload?.orderId, ''),
  amount: Number(payload?.amount ?? 0),
  currency: getSafeText(payload?.currency, 'INR'),
  utr: getSafeText(payload?.utr, ''),
  status: 'paid',
  createdAt: payload?.createdAt,
  paidAt: payload?.paidAt,
  confirmedAt: payload?.confirmedAt,
  booking: normalizeBooking(payload?.booking || {}),
  service: typeof payload?.service === 'object' ? normalizeService(payload.service) : payload?.service,
  user: typeof payload?.user === 'object' ? normalizeUser(payload.user)! : payload?.user,
});

export const normalizeReview = (review: any): Review => ({
  _id: review._id,
  id: review._id,
  service: review.service || '',
  user: typeof review.user === 'object' ? normalizeUser(review.user)! : review.user,
  rating: Number(review.rating ?? 0),
  comment: getSafeText(review.comment, 'No review comment provided'),
  createdAt: review.createdAt,
});

export const normalizeChatMessage = (message: any): ChatMessage => ({
  _id: message._id,
  booking: message.booking,
  sender: typeof message.sender === 'object' ? normalizeUser(message.sender)! : message.sender,
  recipient: typeof message.recipient === 'object' ? normalizeUser(message.recipient)! : message.recipient,
  text: message.text || '',
  readAt: message.readAt,
  createdAt: message.createdAt,
});

export const normalizeNotification = (notification: any): NotificationItem => ({
  _id: notification._id,
  type: notification.type,
  title: notification.title || '',
  message: notification.message || '',
  link: notification.link || '',
  readAt: notification.readAt,
  createdAt: notification.createdAt,
  metadata: notification.metadata || {},
});

export const normalizeAdminOverview = (payload: any): AdminOverview => ({
  summary: {
    users: Number(payload?.summary?.users ?? 0),
    organizers: Number(payload?.summary?.organizers ?? 0),
    services: Number(payload?.summary?.services ?? 0),
    bookings: Number(payload?.summary?.bookings ?? 0),
    payments: Number(payload?.summary?.payments ?? 0),
  },
  users: Array.isArray(payload?.users) ? payload.users.map(normalizeUser).filter(Boolean) as User[] : [],
  services: Array.isArray(payload?.services) ? payload.services.map(normalizeService) : [],
  bookings: Array.isArray(payload?.bookings) ? payload.bookings.map(normalizeBooking) : [],
  payments: Array.isArray(payload?.payments) ? payload.payments.map(normalizePayment) : [],
});
