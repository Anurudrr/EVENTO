const SMOKE_PATTERNS = [
  /\bsmoke\s*test\b/i,
  /(^|[\s._-])smoke([\s._-]|$)/i,
];

const unwrapDocument = <T>(value: T): T => (
  value && typeof value === 'object' && typeof (value as any).toObject === 'function'
    ? (value as any).toObject()
    : value
);

const hasSmokeMarker = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  return SMOKE_PATTERNS.some((pattern) => pattern.test(normalized));
};

const hasSmokeMarkerInMetadata = (value: unknown, depth = 0): boolean => {
  if (depth > 3 || value == null) {
    return false;
  }

  const candidate = unwrapDocument(value);

  if (typeof candidate === 'string') {
    return hasSmokeMarker(candidate);
  }

  if (Array.isArray(candidate)) {
    return candidate.some((entry) => hasSmokeMarkerInMetadata(entry, depth + 1));
  }

  if (typeof candidate === 'object') {
    return Object.values(candidate as Record<string, unknown>).some((entry) => (
      hasSmokeMarkerInMetadata(entry, depth + 1)
    ));
  }

  return false;
};

const hasSmokeMarkerInValues = (values: unknown[]): boolean => (
  values.some((value) => {
    if (typeof value === 'string') {
      return hasSmokeMarker(value);
    }

    if (Array.isArray(value)) {
      return hasSmokeMarkerInValues(value);
    }

    return false;
  })
);

export const isSmokeTestUser = (user: any): boolean => {
  const candidate = unwrapDocument(user);

  if (!candidate || typeof candidate !== 'object') {
    return hasSmokeMarker(candidate);
  }

  return hasSmokeMarkerInValues([
    candidate.name,
    candidate.email,
    candidate.profilePicture,
    candidate.bio,
  ]);
};

export const isSmokeTestService = (service: any): boolean => {
  const candidate = unwrapDocument(service);

  if (!candidate || typeof candidate !== 'object') {
    return hasSmokeMarker(candidate);
  }

  return hasSmokeMarkerInValues([
    candidate.title,
    candidate.description,
    candidate.location,
    candidate.category,
    candidate.upiId,
    candidate.images || [],
    candidate.rawImages || [],
  ])
    || isSmokeTestUser(candidate.organizer)
    || isSmokeTestUser(candidate.createdBy);
};

export const isSmokeTestBooking = (booking: any): boolean => {
  const candidate = unwrapDocument(booking);

  if (!candidate || typeof candidate !== 'object') {
    return hasSmokeMarker(candidate);
  }

  return hasSmokeMarkerInValues([
    candidate.orderId,
    candidate.bookingReference,
    candidate.contactName,
    candidate.phone,
    candidate.eventType,
    candidate.eventLocation,
    candidate.notes,
    candidate.transactionId,
    candidate.paymentOrderId,
    candidate.paymentFailureReason,
    candidate.upiIdUsed,
  ])
    || isSmokeTestService(candidate.service)
    || isSmokeTestUser(candidate.user)
    || isSmokeTestUser(candidate.organizer);
};

export const isSmokeTestPayment = (payment: any): boolean => {
  const candidate = unwrapDocument(payment);

  if (!candidate || typeof candidate !== 'object') {
    return hasSmokeMarker(candidate);
  }

  return hasSmokeMarkerInValues([
    candidate.orderId,
    candidate.utr,
    candidate.upiId,
    candidate.rejectionReason,
  ])
    || isSmokeTestBooking(candidate.booking)
    || isSmokeTestService(candidate.service)
    || isSmokeTestUser(candidate.user)
    || isSmokeTestUser(candidate.organizer);
};

export const isSmokeTestNotification = (notification: any): boolean => {
  const candidate = unwrapDocument(notification);

  if (!candidate || typeof candidate !== 'object') {
    return hasSmokeMarker(candidate);
  }

  return hasSmokeMarkerInValues([
    candidate.title,
    candidate.message,
    candidate.link,
  ]) || hasSmokeMarkerInMetadata(candidate.metadata);
};
