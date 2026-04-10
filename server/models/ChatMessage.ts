import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
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

chatMessageSchema.index({ booking: 1, createdAt: 1 });
chatMessageSchema.index({ recipient: 1, createdAt: -1 });

const ChatMessage: mongoose.Model<any> = (mongoose.models.ChatMessage as mongoose.Model<any>)
  || (mongoose.model<any>('ChatMessage', chatMessageSchema) as mongoose.Model<any>);

export default ChatMessage;
