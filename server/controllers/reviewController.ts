import type { Response, NextFunction } from 'express';
import Booking from '../models/Booking.ts';
import Service from '../models/Service.ts';
import { createNotification } from '../utils/notifications.ts';

const recalculateReviewStats = (service: any) => {
  const reviewEntries = Array.isArray(service.reviewEntries) ? service.reviewEntries : [];
  const reviewCount = reviewEntries.length;
  const averageRating = reviewCount > 0
    ? reviewEntries.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  service.reviews = reviewCount;
  service.rating = Number(averageRating.toFixed(1));
};

export const getServiceReviews = async (req: any, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.serviceId).populate('reviewEntries.user', 'name email role profilePicture');

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const reviews = [...service.reviewEntries].sort(
      (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

export const createServiceReview = async (req: any, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const completedBooking = await Booking.findOne({
      user: req.user.id,
      service: req.params.serviceId,
      status: 'completed',
    });

    if (!completedBooking) {
      return res.status(403).json({
        success: false,
        error: 'You can review this service only after your booking has been completed',
      });
    }

    const existingReview = service.reviewEntries.find(
      (review: any) => review.user.toString() === req.user.id,
    );

    if (existingReview) {
      existingReview.rating = req.body.rating;
      existingReview.comment = req.body.comment;
    } else {
      service.reviewEntries.push({
        user: req.user.id,
        rating: req.body.rating,
        comment: req.body.comment,
      });
    }

    recalculateReviewStats(service);
    await service.save();
    await service.populate('reviewEntries.user', 'name email role profilePicture');

    const review = [...service.reviewEntries].find(
      (entry: any) => entry.user && entry.user._id.toString() === req.user.id,
    );

    await createNotification({
      user: service.organizer.toString(),
      type: 'review',
      title: existingReview ? 'Review updated' : 'New review received',
      message: `${req.user.name} left a ${req.body.rating}-star review for ${service.title}.`,
      link: `/event/${service._id.toString()}`,
      metadata: {
        serviceId: service._id.toString(),
        reviewId: review?._id?.toString?.(),
      },
    });

    res.status(existingReview ? 200 : 201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteServiceReview = async (req: any, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findOne({ 'reviewEntries._id': req.params.id });

    if (!service) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const review = service.reviewEntries.id(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this review' });
    }

    review.deleteOne();
    recalculateReviewStats(service);
    await service.save();

    res.status(200).json({
      success: true,
      data: { id: req.params.id },
    });
  } catch (err) {
    next(err);
  }
};
