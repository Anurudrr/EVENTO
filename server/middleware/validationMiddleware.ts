import Joi from 'joi';
import type { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'organizer').default('user'),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  next();
};

export const validateSendOtp = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    purpose: Joi.string().valid('signup', 'login').required(),
    email: Joi.string().email().required(),
    name: Joi.when('purpose', {
      is: 'signup',
      then: Joi.string().required(),
      otherwise: Joi.string().optional().allow(''),
    }),
    password: Joi.when('purpose', {
      is: 'signup',
      then: Joi.string().min(6).required(),
      otherwise: Joi.string().optional().allow(''),
    }),
    role: Joi.when('purpose', {
      is: 'signup',
      then: Joi.string().valid('user', 'organizer').default('user'),
      otherwise: Joi.string().valid('user', 'organizer').optional(),
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateVerifyOtp = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    purpose: Joi.string().valid('signup', 'login').required(),
    email: Joi.string().email().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateGoogleAuth = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    idToken: Joi.string().required(),
    role: Joi.string().valid('user', 'organizer').default('user'),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateEvent = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    title: Joi.string().max(100).required(),
    description: Joi.string().max(1000).required(),
    date: Joi.date().required(),
    location: Joi.string().required(),
    category: Joi.string().required(),
    images: Joi.array().items(Joi.string()).default([]),
    price: Joi.number().min(0),
    availableSeats: Joi.number().min(0),
    totalSeats: Joi.number().min(0).required(),
    badge: Joi.string().valid('Trending', 'New', 'Limited Seats', 'Sold Out', ''),
    rating: Joi.number().min(1).max(5),
    reviews: Joi.number().min(0),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  next();
};

export const validateBooking = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    serviceId: Joi.string().required(),
    date: Joi.date().required(),
    time: Joi.string().trim().required(),
    contactName: Joi.string().trim().max(120).optional().allow(''),
    phone: Joi.string().trim().max(30).optional().allow(''),
    eventType: Joi.string().trim().max(120).optional().allow(''),
    eventLocation: Joi.string().trim().max(160).optional().allow(''),
    guests: Joi.number().integer().min(1).max(5000).required(),
    notes: Joi.string().max(1000).allow('').default(''),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  req.body = value;
  next();
};

export const validateRazorpayVerification = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validatePaymentFailure = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    code: Joi.string().trim().max(100).optional().allow(''),
    description: Joi.string().trim().max(500).optional().allow(''),
    source: Joi.string().trim().max(100).optional().allow(''),
    step: Joi.string().trim().max(100).optional().allow(''),
    reason: Joi.string().trim().max(200).optional().allow(''),
    metadata: Joi.object().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateCreateService = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    title: Joi.string().max(120).required(),
    description: Joi.string().max(2000).required(),
    price: Joi.number().min(0).required(),
    priceLabel: Joi.string().trim().max(120).optional().allow(''),
    category: Joi.string().required(),
    location: Joi.string().max(120).required(),
    upiId: Joi.string().trim().pattern(/^[\w.-]{2,}@[A-Za-z]{2,}$/).required(),
    images: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string().allow(''),
    ).optional(),
    availability: Joi.alternatives().try(
      Joi.array().items(
        Joi.object({
          date: Joi.date().required(),
          isAvailable: Joi.boolean().required(),
          note: Joi.string().max(160).allow('').default(''),
        }),
      ),
      Joi.string().allow(''),
    ).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateAvailability = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    availability: Joi.array().items(
      Joi.object({
        date: Joi.date().required(),
        isAvailable: Joi.boolean().required(),
        note: Joi.string().max(160).allow('').default(''),
      }),
    ).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateBookingStatus = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    status: Joi.string().valid('accepted', 'confirmed', 'rejected', 'completed').required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateBookingPayment = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    transactionId: Joi.string().trim().max(120).allow('').optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateUpiPaymentSubmission = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    orderId: Joi.string().trim().required(),
    utr: Joi.string().trim().min(8).max(120).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateAdminPaymentDecision = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    reason: Joi.string().trim().max(300).allow('').optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateReview = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(1000).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  next();
};

export const validateChatMessage = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    text: Joi.string().trim().min(1).max(2000).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateContact = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    subject: Joi.string().max(150).required(),
    message: Joi.string().max(2000).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
  next();
};
