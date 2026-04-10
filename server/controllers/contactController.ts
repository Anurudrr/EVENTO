import type { Request, Response, NextFunction } from 'express';
import ContactMessage from '../models/ContactMessage.ts';

// @desc    Create contact message
// @route   POST /api/contact
// @access  Public
export const createContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactMessage = await ContactMessage.create({
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: contactMessage._id,
        status: contactMessage.status,
      },
      message: 'Message received successfully',
    });
  } catch (err) {
    next(err);
  }
};
