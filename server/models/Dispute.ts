import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
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
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Dispute category cannot be more than 120 characters'],
    },
    details: {
      type: String,
      required: [true, 'Please provide dispute details'],
      trim: true,
      maxlength: [1500, 'Dispute details cannot be more than 1500 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Resolution notes cannot be more than 500 characters'],
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ raisedBy: 1, createdAt: -1 });

const Dispute: mongoose.Model<any> = (mongoose.models.Dispute as mongoose.Model<any>)
  || (mongoose.model<any>('Dispute', disputeSchema) as mongoose.Model<any>);

export default Dispute;
