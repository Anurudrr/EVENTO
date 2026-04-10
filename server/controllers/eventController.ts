import type { Request, Response, NextFunction } from 'express';
import Event from '../models/Event.ts';

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search', 'seller', 'location', 'minPrice', 'maxPrice', 'minRating'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    // Finding resource
    query = Event.find(JSON.parse(queryStr));

    if (req.query.seller) {
      query = query.find({ createdBy: req.query.seller });
    }

    // Search by title
    if (req.query.search) {
      query = query.find({
        title: { $regex: req.query.search as string, $options: 'i' },
      });
    }

    if (req.query.location) {
      query = query.find({
        location: { $regex: req.query.location as string, $options: 'i' },
      });
    }

    if (req.query.minPrice || req.query.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (req.query.minPrice) {
        priceFilter.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        priceFilter.$lte = Number(req.query.maxPrice);
      }
      query = query.find({ price: priceFilter });
    }

    if (req.query.minRating) {
      query = query.find({ rating: { $gte: Number(req.query.minRating) } });
    }

    // Select Fields
    if (req.query.select) {
      const fields = (req.query.select as string).split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Event.countDocuments(query.getFilter());

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const events = await query.populate('createdBy', 'name email role profilePicture createdAt');

    // Pagination result
    const pagination: any = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: events.length,
      pagination,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email role profilePicture createdAt');

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    req.body.availableSeats = req.body.availableSeats ?? req.body.totalSeats;
    req.body.images = Array.isArray(req.body.images) ? req.body.images : [];

    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req: any, res: Response, next: NextFunction) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Make sure user is event owner or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this event' });
    }

    if (req.body.totalSeats && !req.body.availableSeats) {
      const seatsDiff = req.body.totalSeats - event.totalSeats;
      req.body.availableSeats = Math.max(0, event.availableSeats + seatsDiff);
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email role profilePicture createdAt');

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req: any, res: Response, next: NextFunction) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Make sure user is event owner or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this event' });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
