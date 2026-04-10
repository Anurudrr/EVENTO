import Booking from '../models/Booking.js';
import Event from '../models/Event.js';

// @desc    Book an event
// @route   POST /api/bookings
// @access  Private
const bookEvent = async (req, res, next) => {
  try {
    const { eventId, seatsBooked } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.availableSeats < seatsBooked) {
      return res.status(400).json({ success: false, message: 'Not enough seats available' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      event: eventId,
      seatsBooked,
    });

    // Update available seats
    event.availableSeats -= seatsBooked;
    await event.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Make sure user is booking owner
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'User not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    // Restore seats
    const event = await Event.findById(booking.event);
    if (event) {
      event.availableSeats += booking.seatsBooked;
      await event.save();
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('event', 'title date location price');
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for organizer's events
// @route   GET /api/bookings/organizer
// @access  Private (Organizer)
const getOrganizerBookings = async (req, res, next) => {
  try {
    // Find events created by this user
    const events = await Event.find({ createdBy: req.user._id });
    const eventIds = events.map((event) => event._id);

    // Find bookings for those events
    const bookings = await Booking.find({ event: { $in: eventIds } })
      .populate('event', 'title date location price')
      .populate('user', 'name email');

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

export { bookEvent, cancelBooking, getMyBookings, getOrganizerBookings };
