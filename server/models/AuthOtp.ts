import mongoose from 'mongoose';

const authOtpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['signup', 'login'],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    pendingName: {
      type: String,
      default: '',
      trim: true,
    },
    pendingPasswordHash: {
      type: String,
      default: '',
      select: false,
    },
    pendingRole: {
      type: String,
      enum: ['user', 'organizer'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

authOtpSchema.index({ email: 1, purpose: 1 }, { unique: true });
authOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AuthOtp: mongoose.Model<any> = (mongoose.models.AuthOtp as mongoose.Model<any>)
  || (mongoose.model<any>('AuthOtp', authOtpSchema) as mongoose.Model<any>);

export default AuthOtp;
