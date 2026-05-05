import mongoose from 'mongoose';

const plannerLocationSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      min: [-90, 'Latitude must be at least -90'],
      max: [90, 'Latitude must be at most 90'],
    },
    lng: {
      type: Number,
      min: [-180, 'Longitude must be at least -180'],
      max: [180, 'Longitude must be at most 180'],
    },
  },
  {
    _id: false,
  },
);

const shortlistEntrySchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    matchedCategory: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Matched category cannot be more than 80 characters'],
    },
    score: {
      type: Number,
      default: 0,
      min: [0, 'Score cannot be negative'],
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [240, 'Shortlist reason cannot be more than 240 characters'],
    },
    basePrice: {
      type: Number,
      default: 0,
      min: [0, 'Base price cannot be negative'],
    },
  },
  {
    _id: false,
  },
);

const plannerRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a contact name'],
      trim: true,
      maxlength: [120, 'Name cannot be more than 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      trim: true,
      lowercase: true,
      maxlength: [160, 'Email cannot be more than 160 characters'],
      index: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: [30, 'Phone number cannot be more than 30 characters'],
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      trim: true,
      maxlength: [120, 'City cannot be more than 120 characters'],
      index: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Please provide an event date'],
      index: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: [1, 'Guest count must be at least 1'],
      max: [5000, 'Guest count cannot exceed 5000'],
    },
    budgetMin: {
      type: Number,
      default: 0,
      min: [0, 'Minimum budget cannot be negative'],
    },
    budgetMax: {
      type: Number,
      required: true,
      min: [0, 'Maximum budget cannot be negative'],
    },
    vibe: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Vibe cannot be more than 120 characters'],
    },
    eventType: {
      type: String,
      default: 'General Event',
      trim: true,
      maxlength: [120, 'Event type cannot be more than 120 characters'],
    },
    requiredServices: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1500, 'Notes cannot be more than 1500 characters'],
    },
    attachmentUrls: {
      type: [String],
      default: [],
    },
    serviceLocation: {
      type: plannerLocationSchema,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['new', 'shortlisted', 'reviewing', 'closed'],
      default: 'shortlisted',
      index: true,
    },
    shortlist: {
      type: [shortlistEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

plannerRequestSchema.index({ createdAt: -1 });
plannerRequestSchema.index({ status: 1, createdAt: -1 });

const PlannerRequest: mongoose.Model<any> = (mongoose.models.PlannerRequest as mongoose.Model<any>)
  || (mongoose.model<any>('PlannerRequest', plannerRequestSchema) as mongoose.Model<any>);

export default PlannerRequest;
