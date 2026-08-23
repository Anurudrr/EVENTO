import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Refund amount cannot be negative'],
    },
    reason: {
      type: String,
      required: [true, 'Please provide a refund reason'],
      trim: true,
      maxlength: [500, 'Refund reason cannot be more than 500 characters'],
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'processed'],
      default: 'requested',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [400, 'Refund notes cannot be more than 400 characters'],
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

refundRequestSchema.index({ user: 1, createdAt: -1 });
refundRequestSchema.index({ organizer: 1, status: 1, createdAt: -1 });

const RefundRequest: mongoose.Model<any> = (mongoose.models.RefundRequest as mongoose.Model<any>)
  || (mongoose.model<any>('RefundRequest', refundRequestSchema) as mongoose.Model<any>);

export default RefundRequest;
