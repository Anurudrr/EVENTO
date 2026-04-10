import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['booking', 'payment', 'chat', 'review', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Notification message cannot exceed 500 characters'],
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification: mongoose.Model<any> = (mongoose.models.Notification as mongoose.Model<any>)
  || (mongoose.model<any>('Notification', notificationSchema) as mongoose.Model<any>);

export default Notification;
