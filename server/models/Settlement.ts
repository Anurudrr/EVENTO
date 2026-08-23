import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['commission', 'hold', 'payout', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Ledger amount cannot be negative'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [240, 'Ledger note cannot be more than 240 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const settlementSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
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
    grossAmount: {
      type: Number,
      required: true,
      min: [0, 'Gross amount cannot be negative'],
    },
    commissionRate: {
      type: Number,
      required: true,
      min: [0, 'Commission rate cannot be negative'],
      max: [1, 'Commission rate cannot exceed 1'],
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: [0, 'Commission amount cannot be negative'],
    },
    netAmount: {
      type: Number,
      required: true,
      min: [0, 'Net amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'on_hold', 'ready', 'paid', 'reversed'],
      default: 'pending',
      index: true,
    },
    dueAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [400, 'Settlement notes cannot be more than 400 characters'],
    },
    entries: {
      type: [ledgerEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

settlementSchema.index({ organizer: 1, status: 1, createdAt: -1 });
settlementSchema.index({ status: 1, dueAt: 1 });

const Settlement: mongoose.Model<any> = (mongoose.models.Settlement as mongoose.Model<any>)
  || (mongoose.model<any>('Settlement', settlementSchema) as mongoose.Model<any>);

export default Settlement;
