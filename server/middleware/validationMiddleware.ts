import Joi from 'joi';
import type { Request, Response, NextFunction } from 'express';

const withCoordinatePairValidation = <T extends Joi.ObjectSchema<any>>(schema: T) => (
  schema.custom((value, helpers) => {
    const hasLat = value.lat !== undefined && value.lat !== null && value.lat !== '';
    const hasLng = value.lng !== undefined && value.lng !== null && value.lng !== '';

    if (hasLat !== hasLng) {
      return helpers.error('any.invalid');
    }

    return value;
  }, 'coordinate pair validation')
);

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
  const schema = withCoordinatePairValidation(Joi.object({
    title: Joi.string().max(100).required(),
    description: Joi.string().max(1000).required(),
    date: Joi.date().required(),
    location: Joi.string().required(),
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
    category: Joi.string().required(),
    images: Joi.array().items(Joi.string()).default([]),
    price: Joi.number().min(0),
    availableSeats: Joi.number().min(0),
    totalSeats: Joi.number().min(0).required(),
    badge: Joi.string().valid('Trending', 'New', 'Limited Seats', 'Sold Out', ''),
    rating: Joi.number().min(1).max(5),
    reviews: Joi.number().min(0),
  }));

  const { error, value } = schema.validate(req.body);
  if (error) {
    const coordinateError = error.details[0]?.type === 'any.invalid'
      ? 'Latitude and longitude must be provided together'
      : error.details[0]?.message || 'Invalid event payload';

    return res.status(400).json({ success: false, error: coordinateError });
  }

  req.body = value;
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
    serviceLocation: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    }).required(),
    guests: Joi.number().integer().min(1).max(5000).required(),
    notes: Joi.string().max(1000).allow('').default(''),
    selectedPackageId: Joi.string().trim().allow('').optional(),
    selectedAddOns: Joi.array().items(
      Joi.object({
        addOnId: Joi.string().trim().required(),
        quantity: Joi.number().integer().min(1).max(20).default(1),
      }),
    ).default([]),
    customResponses: Joi.array().items(
      Joi.object({
        questionId: Joi.string().trim().allow('').optional(),
        label: Joi.string().trim().max(120).required(),
        answer: Joi.string().trim().max(500).required(),
      }),
    ).default([]),
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
  const schema = withCoordinatePairValidation(Joi.object({
    title: Joi.string().max(120).required(),
    description: Joi.string().max(2000).required(),
    price: Joi.number().min(0).required(),
    priceLabel: Joi.string().trim().max(120).optional().allow(''),
    bookingMode: Joi.string().valid('instant', 'quote').default('instant'),
    minimumSpend: Joi.number().min(0).optional(),
    advancePercentage: Joi.number().min(0).max(100).optional(),
    category: Joi.string().required(),
    location: Joi.string().max(120).required(),
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
    upiId: Joi.string().trim().pattern(/^[\w.-]{2,}@[A-Za-z]{2,}$/).required(),
    cancellationPolicy: Joi.string().trim().max(500).optional().allow(''),
    refundPolicy: Joi.string().trim().max(500).optional().allow(''),
    serviceTerms: Joi.string().trim().max(700).optional().allow(''),
    deliverables: Joi.alternatives().try(
      Joi.array().items(Joi.string().max(160)),
      Joi.string().allow(''),
    ).optional(),
    packages: Joi.alternatives().try(
      Joi.array().items(
        Joi.object({
          _id: Joi.string().trim().allow('').optional(),
          name: Joi.string().trim().max(120).required(),
          description: Joi.string().trim().max(500).allow('').optional(),
          price: Joi.number().min(0).required(),
          guestLimit: Joi.number().integer().min(1).max(5000).optional(),
          isFeatured: Joi.boolean().optional(),
          deliverables: Joi.array().items(Joi.string().max(140)).default([]),
        }),
      ),
      Joi.string().allow(''),
    ).optional(),
    addOns: Joi.alternatives().try(
      Joi.array().items(
        Joi.object({
          _id: Joi.string().trim().allow('').optional(),
          name: Joi.string().trim().max(120).required(),
          description: Joi.string().trim().max(300).allow('').optional(),
          price: Joi.number().min(0).required(),
        }),
      ),
      Joi.string().allow(''),
    ).optional(),
    customQuestions: Joi.alternatives().try(
      Joi.array().items(
        Joi.object({
          _id: Joi.string().trim().allow('').optional(),
          label: Joi.string().trim().max(120).required(),
          type: Joi.string().valid('text', 'textarea', 'number', 'select').default('text'),
          required: Joi.boolean().default(false),
          placeholder: Joi.string().trim().max(160).allow('').optional(),
          options: Joi.array().items(Joi.string().max(80)).default([]),
        }),
      ),
      Joi.string().allow(''),
    ).optional(),
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
  }));

  const { error, value } = schema.validate(req.body);
  if (error) {
    const coordinateError = error.details[0]?.type === 'any.invalid'
      ? 'Latitude and longitude must be provided together'
      : error.details[0]?.message || 'Invalid service payload';

    return res.status(400).json({ success: false, error: coordinateError });
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
    transactionId: Joi.string().trim().min(8).max(120).allow('').optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  const hasTransactionId = typeof value.transactionId === 'string' && value.transactionId.trim().length > 0;
  const hasScreenshot = Boolean((req as Request & { file?: Express.Multer.File }).file);

  if (!hasTransactionId && !hasScreenshot) {
    return res.status(400).json({
      success: false,
      error: 'Provide either a transaction reference or a payment screenshot.',
    });
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

export const validateAdminOrganizerDecision = (req: Request, res: Response, next: NextFunction) => {
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

export const validatePlannerRequest = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().trim().max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().max(30).allow('').optional(),
    city: Joi.string().trim().max(120).required(),
    eventDate: Joi.date().required(),
    guestCount: Joi.number().integer().min(1).max(5000).required(),
    budgetMin: Joi.number().min(0).default(0),
    budgetMax: Joi.number().min(0).required(),
    vibe: Joi.string().trim().max(120).allow('').optional(),
    eventType: Joi.string().trim().max(120).allow('').optional(),
    requiredServices: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().max(80)),
      Joi.string().allow(''),
    ).optional(),
    notes: Joi.string().trim().max(1500).allow('').optional(),
    serviceLocation: Joi.alternatives().try(
      Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
      }),
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

export const validateTelemetryEvent = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    kind: Joi.string().trim().max(80).required(),
    name: Joi.string().trim().max(120).required(),
    level: Joi.string().valid('info', 'success', 'warning', 'error').default('info'),
    path: Joi.string().trim().max(200).allow('').optional(),
    metadata: Joi.object().unknown(true).default({}),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateRefundRequest = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    reason: Joi.string().trim().max(500).required(),
    amount: Joi.number().min(0).optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateDisputeRequest = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    category: Joi.string().trim().max(120).required(),
    details: Joi.string().trim().max(1500).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateRefundDecision = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    notes: Joi.string().trim().max(400).allow('').optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  req.body = value;
  next();
};

export const validateDisputeDecision = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    notes: Joi.string().trim().max(500).allow('').optional(),
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
