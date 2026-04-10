import mongoose from 'mongoose';
import crypto from 'crypto';

export const createBookingReference = () => (
  `EVT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
);

export const createBookingOrderId = () => (
  `BOOK-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
);

const LEGACY_BOOKING_UNIQUE_FIELDS = new Set(['email', 'phone', 'bookingReference']);

const getDuplicateKeyFields = (index: { key?: Record<string, unknown> } | null | undefined) => (
  Object.keys(index?.key || {})
);

const shouldDropLegacyUniqueIndex = (index: { unique?: boolean; key?: Record<string, unknown> }) => (
  Boolean(index.unique)
  && getDuplicateKeyFields(index).some((field) => LEGACY_BOOKING_UNIQUE_FIELDS.has(field))
);

const generateUniqueOrderId = (usedOrderIds: Set<string>) => {
  let nextOrderId = createBookingOrderId();

  while (usedOrderIds.has(nextOrderId)) {
    nextOrderId = createBookingOrderId();
  }

  usedOrderIds.add(nextOrderId);
  return nextOrderId;
};

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'userId',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      alias: 'serviceId',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'organizerId',
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      default: createBookingOrderId,
    },
    bookingReference: {
      type: String,
      index: true,
      trim: true,
      default: createBookingReference,
    },
    date: {
      type: Date,
      required: [true, 'Please add a booking date'],
    },
    contactName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Contact name cannot be more than 120 characters'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: [30, 'Phone number cannot be more than 30 characters'],
    },
    eventType: {
      type: String,
      default: 'General Event',
      trim: true,
      maxlength: [120, 'Event type cannot be more than 120 characters'],
    },
    eventLocation: {
      type: String,
      default: '',
      trim: true,
      maxlength: [160, 'Event location cannot be more than 160 characters'],
    },
    time: {
      type: String,
      required: [true, 'Please add a booking time'],
      trim: true,
    },
    guests: {
      type: Number,
      required: true,
      min: [1, 'Guests must be at least 1'],
      max: [5000, 'Guests cannot exceed 5000'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Notes cannot be more than 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'failed', 'paid_pending_verification', 'verified'],
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    paymentProvider: {
      type: String,
      enum: ['none', 'manual_upi', 'upi_qr', 'razorpay'],
      default: 'none',
    },
    paymentOrderId: {
      type: String,
      default: '',
      trim: true,
    },
    paymentId: {
      type: String,
      default: '',
      trim: true,
    },
    paymentSignature: {
      type: String,
      default: '',
      trim: true,
    },
    paymentFailureReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Payment failure reason cannot be more than 500 characters'],
    },
    upiIdUsed: {
      type: String,
      default: '',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paymentScreenshot: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ organizer: 1, createdAt: -1 });
bookingSchema.index({ service: 1, date: 1, time: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });

const Booking: mongoose.Model<any> = (mongoose.models.Booking as mongoose.Model<any>)
  || (mongoose.model<any>('Booking', bookingSchema) as mongoose.Model<any>);

let bookingIndexesPromise: Promise<void> | null = null;

const backfillBookingOrderIds = async () => {
  const bookings = await Booking.find({}, { _id: 1, orderId: 1 }).lean();
  const usedOrderIds = new Set<string>();
  const operations: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: Record<string, unknown>;
    };
  }> = [];

  for (const booking of bookings) {
    const existingOrderId = typeof booking.orderId === 'string' ? booking.orderId.trim() : '';

    if (!existingOrderId || usedOrderIds.has(existingOrderId)) {
      operations.push({
        updateOne: {
          filter: { _id: booking._id },
          update: { $set: { orderId: generateUniqueOrderId(usedOrderIds) } },
        },
      });
      continue;
    }

    usedOrderIds.add(existingOrderId);
  }

  if (operations.length > 0) {
    await Booking.bulkWrite(operations, { ordered: false });
    console.log(`[booking:indexes] Backfilled orderId for ${operations.length} booking(s).`);
  }
};

export const ensureBookingIndexes = async () => {
  if (bookingIndexesPromise) {
    return bookingIndexesPromise;
  }

  bookingIndexesPromise = (async () => {
    const existingIndexes = await Booking.collection.indexes().catch((error: any) => {
      if (error?.codeName === 'NamespaceNotFound') {
        return [];
      }

      throw error;
    });

    for (const index of existingIndexes) {
      if (!index?.name || !shouldDropLegacyUniqueIndex(index)) {
        continue;
      }

      await Booking.collection.dropIndex(index.name).catch((error: any) => {
        if (error?.codeName === 'IndexNotFound') {
          return;
        }

        throw error;
      });

      console.log(`[booking:indexes] Dropped legacy unique index "${index.name}".`);
    }

    await backfillBookingOrderIds();
    await Booking.createIndexes();
  })().catch((error) => {
    bookingIndexesPromise = null;
    throw error;
  });

  return bookingIndexesPromise;
};

export default Booking;
