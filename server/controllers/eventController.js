import Event from '../models/Event.js';

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer)
const createEvent = async (req, res, next) => {
  try {
    const { title, description, date, location, price, totalSeats, category, rating, images } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      location,
      price,
      totalSeats,
      availableSeats: totalSeats,
      category,
      rating,
      images,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (req.query.createdBy) {
      query.createdBy = req.query.createdBy;
    }

    let queryBuilder = Event.find(query).populate('createdBy', 'name email');

    if (sort) {
      if (sort === 'price-low') queryBuilder = queryBuilder.sort('price');
      else if (sort === 'price-high') queryBuilder = queryBuilder.sort('-price');
      else if (sort === 'rating') queryBuilder = queryBuilder.sort('-rating');
      else queryBuilder = queryBuilder.sort('-createdAt');
    } else {
      queryBuilder = queryBuilder.sort('-createdAt');
    }

    const events = await queryBuilder;
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (event) {
      res.json({ success: true, data: event });
    } else {
      res.status(404).json({ success: false, message: 'Event not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer)
const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Make sure user is event owner
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'User not authorized to update this event' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer)
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Make sure user is event owner
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this event' });
    }

    await event.deleteOne();

    res.json({ success: true, message: 'Event removed' });
  } catch (error) {
    next(error);
  }
};

export { createEvent, getEvents, getEventById, updateEvent, deleteEvent };
