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
    images: {
      type: [String],
      default: [],
    },
    upiId: {
      type: String,
      default: '',
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
serviceSchema.index({ organizer: 1, createdAt: -1 });

const Service: mongoose.Model<any> = (mongoose.models.Service as mongoose.Model<any>)
  || (mongoose.model<any>('Service', serviceSchema) as mongoose.Model<any>);

export default Service;
