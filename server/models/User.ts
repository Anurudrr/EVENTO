import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      required(this: any) {
        return this.authProvider === 'local';
      },
    },
    role: {
      type: String,
      enum: ['user', 'organizer', 'admin'],
      default: 'user',
    },
    profilePicture: {
      type: String,
      default: '',
      alias: 'profilePic',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: '',
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    upiId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, createdAt: -1 });

// Encrypt password using bcrypt
userSchema.pre('save', async function (this: any) {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  // OTP signup stores a pre-hashed password temporarily; avoid hashing it twice.
  if (typeof this.password === 'string' && this.password.startsWith('$2')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  if (!this.password) {
    return false;
  }

  return await bcrypt.compare(enteredPassword, this.password);
};

const User: mongoose.Model<any> = (mongoose.models.User as mongoose.Model<any>)
  || (mongoose.model<any>('User', userSchema) as mongoose.Model<any>);

export default User;
