import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Wishlist: mongoose.Model<any> = (mongoose.models.Wishlist as mongoose.Model<any>)
  || (mongoose.model<any>('Wishlist', wishlistSchema) as mongoose.Model<any>);

export default Wishlist;
