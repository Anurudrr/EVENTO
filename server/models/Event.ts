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
  }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
    },
    images: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      default: 0,
    },
    availableSeats: {
      type: Number,
      default: function (this: any) {
        return this.totalSeats;
      },
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please add total seats'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    badge: {
      type: String,
      enum: ['Trending', 'New', 'Limited Seats', 'Sold Out', ''],
      default: '',
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
  },
  {
    timestamps: true,
  }
);

const Event: mongoose.Model<any> = (mongoose.models.Event as mongoose.Model<any>)
  || (mongoose.model<any>('Event', eventSchema) as mongoose.Model<any>);

export default Event;
