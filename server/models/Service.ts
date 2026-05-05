import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      required: true,
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
      trim: true,
      maxlength: [1000, 'Comment cannot be more than 1000 characters'],
    },
  },
  {
    timestamps: true,
  },
);

const availabilitySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [160, 'Availability note cannot be more than 160 characters'],
    },
  },
  {
    _id: true,
  },
);

const servicePackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Package name cannot be more than 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Package description cannot be more than 500 characters'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Package price cannot be negative'],
    },
    guestLimit: {
      type: Number,
      min: [1, 'Guest limit must be at least 1'],
      max: [5000, 'Guest limit cannot exceed 5000'],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    deliverables: {
      type: [String],
      default: [],
    },
  },
  {
    _id: true,
  },
);

const serviceAddOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Add-on name cannot be more than 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Add-on description cannot be more than 300 characters'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Add-on price cannot be negative'],
    },
  },
  {
    _id: true,
  },
);

const customQuestionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Custom question label cannot be more than 120 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'select'],
      default: 'text',
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: '',
      trim: true,
      maxlength: [160, 'Question placeholder cannot be more than 160 characters'],
    },
    options: {
      type: [String],
      default: [],
    },
  },
  {
    _id: true,
  },
);

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [120, 'Title cannot be more than 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    priceLabel: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Price label cannot be more than 120 characters'],
    },
    bookingMode: {
      type: String,
      enum: ['instant', 'quote'],
      default: 'instant',
      index: true,
    },
    minimumSpend: {
      type: Number,
      default: 0,
      min: [0, 'Minimum spend cannot be negative'],
    },
    advancePercentage: {
      type: Number,
      default: 100,
      min: [0, 'Advance percentage cannot be negative'],
      max: [100, 'Advance percentage cannot exceed 100'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
      trim: true,
      maxlength: [120, 'Location cannot be more than 120 characters'],
    },
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
    images: {
      type: [String],
      default: [],
    },
    upiId: {
      type: String,
      default: '',
    },
    cancellationPolicy: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Cancellation policy cannot be more than 500 characters'],
    },
    refundPolicy: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Refund policy cannot be more than 500 characters'],
    },
    serviceTerms: {
      type: String,
      default: '',
      trim: true,
      maxlength: [700, 'Service terms cannot be more than 700 characters'],
    },
    deliverables: {
      type: [String],
      default: [],
    },
    packages: {
      type: [servicePackageSchema],
      default: [],
    },
    addOns: {
      type: [serviceAddOnSchema],
      default: [],
    },
    customQuestions: {
      type: [customQuestionSchema],
      default: [],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'organizerId',
    },
    rating: {
      type: Number,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating must be at most 5'],
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    reviewEntries: {
      type: [reviewSchema],
      default: [],
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

serviceSchema.index({ title: 'text', description: 'text', location: 'text', category: 'text' });
serviceSchema.index({ category: 1, createdAt: -1 });
serviceSchema.index({ category: 1, price: 1, rating: -1 });
serviceSchema.index({ bookingMode: 1, category: 1, createdAt: -1 });
serviceSchema.index({ organizer: 1, createdAt: -1 });
serviceSchema.index({ lat: 1, lng: 1 });

const Service: mongoose.Model<any> = (mongoose.models.Service as mongoose.Model<any>)
  || (mongoose.model<any>('Service', serviceSchema) as mongoose.Model<any>);

export default Service;
