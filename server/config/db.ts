import mongoose from 'mongoose';
import { getMongoUri } from '../utils/env.ts';
import { ensureBookingIndexes } from '../models/Booking.ts';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 10000,
    });
    await ensureBookingIndexes();
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`[db] Connection failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;
