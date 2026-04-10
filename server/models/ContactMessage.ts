import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add your email'],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
      trim: true,
      maxlength: [150, 'Subject cannot be more than 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Please add a message'],
      trim: true,
      maxlength: [2000, 'Message cannot be more than 2000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'read'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

const ContactMessage: mongoose.Model<any> = (mongoose.models.ContactMessage as mongoose.Model<any>)
  || (mongoose.model<any>('ContactMessage', contactMessageSchema) as mongoose.Model<any>);

export default ContactMessage;
