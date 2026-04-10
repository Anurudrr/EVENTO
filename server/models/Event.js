import mongoose from 'mongoose';

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
      maxlength: [5000, 'Description cannot be more than 5000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please add total seats'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Please add available seats'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: ['Photography', 'Catering', 'Music', 'Venue', 'Decoration', 'Planning', 'Gifts', 'Other'],
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    images: {
    type: [String],
    default: ['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80'],
  },
  createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
