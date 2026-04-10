import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'userId',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'organizerId',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
      alias: 'serviceId',
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
      alias: 'bookingId',
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
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
    upiId: {
      type: String,
      default: '',
      trim: true,
    },
    utr: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'UTR cannot be more than 120 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Rejection reason cannot be more than 300 characters'],
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ booking: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ organizer: 1, createdAt: -1 });
paymentSchema.index({ service: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment: mongoose.Model<any> = (mongoose.models.Payment as mongoose.Model<any>)
  || (mongoose.model<any>('Payment', paymentSchema) as mongoose.Model<any>);

export default Payment;
