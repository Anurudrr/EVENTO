import React from 'react';

export type UserRole = 'user' | 'organizer' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'failed' | 'paid_pending_verification' | 'verified';
export type PaymentReviewStatus = 'pending' | 'confirmed' | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
  emailVerified?: boolean;
  authProvider?: 'local' | 'google';
  upiId?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'organizer';
}

export type OtpPurpose = 'signup' | 'login';

export interface SendOtpPayload {
  purpose: OtpPurpose;
  email: string;
  name?: string;
  password?: string;
  role?: 'user' | 'organizer';
}

export interface VerifyOtpPayload {
  purpose: OtpPurpose;
  email: string;
  otp: string;
}

export interface GoogleAuthPayload {
  idToken: string;
  role?: 'user' | 'organizer';
}

export interface AvailabilityEntry {
  _id?: string;
  date: string;
  isAvailable: boolean;
  note?: string;
}

export interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceLabel?: string;
  location: string;
  images: string[];
  rawImages?: string[];
  upiId?: string;
  organizer?: User | string;
  rating: number;
  reviews?: number;
  availability?: AvailabilityEntry[];
  createdBy?: string | User;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  category?: string;
  totalSeats?: number;
  availableSeats?: number;
  badge?: string;
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  sort?: string;
  organizer?: string;
  limit?: number;
  seller?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | React.ReactNode;
  description: string;
  image: string;
}

export interface Booking {
  _id: string;
  orderId?: string;
  bookingReference?: string;
  service: string | Service;
  user: string | User;
  organizer: string | User;
  date: string;
  contactName: string;
  phone?: string;
  eventType: string;
  eventLocation?: string;
  time: string;
  guests: number;
  notes: string;
  amount: number;
  currency?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentProvider?: 'none' | 'manual_upi' | 'upi_qr' | 'razorpay';
  paymentOrderId?: string;
  paymentId?: string;
  paymentSignature?: string;
  paymentFailureReason?: string;
  upiIdUsed?: string;
  transactionId?: string;
  paymentScreenshot?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface PaymentRecord {
  _id: string;
  orderId: string;
  amount: number;
  currency?: string;
  upiId: string;
  utr?: string;
  status: PaymentReviewStatus;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  expiresAt?: string;
  booking?: string | Booking;
  service?: string | Service;
  user?: string | User;
  organizer?: string | User;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentSession {
  bookingId: string;
  bookingReference: string;
  orderId: string;
  amount: number;
  currency: string;
  upiId: string;
  upiLink: string;
  payeeName: string;
  expiresAt?: string;
  submittedAt?: string;
  status: PaymentReviewStatus;
  rejectionReason?: string;
  serviceTitle?: string;
  payment?: PaymentRecord;
}

export interface PaymentReceipt {
  orderId: string;
  amount: number;
  currency: string;
  utr?: string;
  status: 'paid';
  createdAt?: string;
  paidAt?: string;
  confirmedAt?: string;
  booking: Booking;
  service?: string | Service;
  user?: string | User;
}

export interface Review {
  _id: string;
  id: string;
  service?: string | Service;
  user: string | User;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface ChatMessage {
  _id: string;
  booking: string;
  sender: string | User;
  recipient: string | User;
  text: string;
  readAt?: string | null;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  type: 'booking' | 'payment' | 'chat' | 'review' | 'system';
  title: string;
  message: string;
  link?: string;
  readAt?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminOverview {
  summary: {
    users: number;
    organizers: number;
    services: number;
    bookings: number;
    payments: number;
  };
  users: User[];
  services: Service[];
  bookings: Booking[];
  payments: PaymentRecord[];
}
