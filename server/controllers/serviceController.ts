import type { Request, Response, NextFunction } from 'express';
import Service from '../models/Service.ts';
import { uploadImageBuffer } from '../utils/cloudinary.ts';
import { toDateKey } from '../utils/date.ts';
import { isDevelopmentEnv } from '../utils/env.ts';
import { isSmokeTestService } from '../utils/smokeArtifacts.ts';

const parseStringArrayField = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim());
      }
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [] as string[];
};

const parseJsonArrayField = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }

  return [] as unknown[];
};

const sanitizeStringList = (value: unknown, maxItems = 12, maxLength = 160) => (
  parseStringArrayField(value)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength))
);

const parseBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true';
  }

  return false;
};

const normalizeIncomingImageValue = (image: string) => {
  const trimmedImage = image.trim();
  if (!trimmedImage) {
    return '';
  }

  try {
    const parsedUrl = new URL(trimmedImage);
    parsedUrl.searchParams.delete('t');

    if (parsedUrl.pathname.startsWith('/uploads/') || parsedUrl.pathname.startsWith('/images/')) {
      const search = parsedUrl.searchParams.toString();
      return `${parsedUrl.pathname}${search ? `?${search}` : ''}`;
    }

    return parsedUrl.toString();
  } catch {
    return trimmedImage;
  }
};

const dedupeImages = (...imageGroups: string[][]) => {
  const uniqueImages = new Set<string>();

  imageGroups.flat().forEach((image) => {
    const normalizedImage = normalizeIncomingImageValue(image);
    if (normalizedImage) {
      uniqueImages.add(normalizedImage);
    }
  });

  return Array.from(uniqueImages);
};

const parseAvailabilityField = (value: unknown) => {
  let source: unknown[] = [];

  if (Array.isArray(value)) {
    source = value;
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        source = parsed;
      }
    } catch {
      source = [];
    }
  }

  const uniqueEntries = new Map<string, { date: Date; isAvailable: boolean; note: string }>();

  source.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const rawDate = (entry as Record<string, unknown>).date;
    const rawNote = (entry as Record<string, unknown>).note;
    const rawIsAvailable = (entry as Record<string, unknown>).isAvailable;

    if (!rawDate) {
      return;
    }

    try {
      const key = toDateKey(rawDate as string);
      uniqueEntries.set(key, {
        date: new Date(`${key}T00:00:00.000Z`),
        isAvailable: Boolean(rawIsAvailable),
        note: typeof rawNote === 'string' ? rawNote.trim() : '',
      });
    } catch {
      // Ignore malformed availability entries.
    }
  });

  return Array.from(uniqueEntries.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
};

const appendCacheBust = (image: string) => `${image}${image.includes('?') ? '&' : '?'}t=${Date.now()}`;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseCoordinate = (value: unknown, min: number, max: number) => {
  const parsed = parseNumber(value);

  if (parsed === undefined || parsed < min || parsed > max) {
    return undefined;
  }

  return parsed;
};

const resolveCoordinates = (
  payload: Record<string, unknown>,
  fallback?: { lat?: number; lng?: number },
) => {
  const hasLatField = Object.prototype.hasOwnProperty.call(payload, 'lat');
  const hasLngField = Object.prototype.hasOwnProperty.call(payload, 'lng');

  if (!hasLatField && !hasLngField) {
    return fallback || {};
  }

  const lat = parseCoordinate(payload.lat, -90, 90);
  const lng = parseCoordinate(payload.lng, -180, 180);

  if (lat === undefined || lng === undefined) {
    return {
      lat: undefined,
      lng: undefined,
    };
  }

  return { lat, lng };
};

const parsePositiveInteger = (value: unknown) => {
  const parsed = parseNumber(value);

  if (parsed === undefined || !Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

const parsePackagesField = (value: unknown) => (
  parseJsonArrayField(value)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      _id: typeof entry._id === 'string' && entry._id.trim() ? entry._id.trim() : undefined,
      name: typeof entry.name === 'string' ? entry.name.trim() : '',
      description: typeof entry.description === 'string' ? entry.description.trim() : '',
      price: parseNumber(entry.price) ?? 0,
      guestLimit: parsePositiveInteger(entry.guestLimit),
      isFeatured: parseBoolean(entry.isFeatured),
      deliverables: sanitizeStringList(entry.deliverables, 8, 140),
    }))
    .filter((entry) => entry.name && entry.price >= 0)
    .slice(0, 6)
);

const parseAddOnsField = (value: unknown) => (
  parseJsonArrayField(value)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      _id: typeof entry._id === 'string' && entry._id.trim() ? entry._id.trim() : undefined,
      name: typeof entry.name === 'string' ? entry.name.trim() : '',
      description: typeof entry.description === 'string' ? entry.description.trim() : '',
      price: parseNumber(entry.price) ?? 0,
    }))
    .filter((entry) => entry.name && entry.price >= 0)
    .slice(0, 10)
);

const parseCustomQuestionsField = (value: unknown) => (
  parseJsonArrayField(value)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => {
      const type = typeof entry.type === 'string' ? entry.type.trim() : 'text';
      return {
        _id: typeof entry._id === 'string' && entry._id.trim() ? entry._id.trim() : undefined,
        label: typeof entry.label === 'string' ? entry.label.trim() : '',
        type: ['text', 'textarea', 'number', 'select'].includes(type) ? type : 'text',
        required: parseBoolean(entry.required),
        placeholder: typeof entry.placeholder === 'string' ? entry.placeholder.trim() : '',
        options: sanitizeStringList(entry.options, 8, 80),
      };
    })
    .filter((entry) => entry.label)
    .slice(0, 8)
);

const normalizeSort = (value: unknown) => {
  if (typeof value !== 'string') {
    return '-createdAt';
  }

  switch (value.trim()) {
    case 'price':
      return 'price';
    case '-price':
      return '-price';
    case 'rating':
    case '-rating':
      return '-rating';
    case 'createdAt':
      return 'createdAt';
    case '-createdAt':
      return '-createdAt';
    default:
      return '-createdAt';
  }
};

const getUploadedImages = async (files: Express.Multer.File[] | undefined) => {
  if (!files?.length) {
    return [] as string[];
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadImageBuffer(file.buffer, file.originalname, 'services')),
  );

  return uploaded.map(appendCacheBust);
};

const getServicePopulate = () => (
  'name email role profilePicture bio createdAt upiId businessName businessType businessLocation responseTimeHours verificationStatus verificationNotes verificationSubmittedAt verifiedAt'
);

const ensureOrganizerAccess = (service: any, user: any) => {
  return service.organizer.toString() === user.id || user.role === 'admin';
};

export const createService = async (req: any, res: Response, next: NextFunction) => {
  try {
    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
    const coordinates = resolveCoordinates(requestBody);
    const existingImages = parseStringArrayField(req.body.images);
    const uploadedImages = await getUploadedImages(req.files as Express.Multer.File[] | undefined);
    const images = dedupeImages(existingImages, uploadedImages);

    if (images.length === 0) {
      return res.status(400).json({ success: false, error: 'Please upload at least one image' });
    }

    const service = await Service.create({
      title: requestBody.title,
      description: requestBody.description,
      price: Number(requestBody.price),
      priceLabel: typeof requestBody.priceLabel === 'string' ? requestBody.priceLabel.trim() : '',
      bookingMode: requestBody.bookingMode === 'quote' ? 'quote' : 'instant',
      minimumSpend: parseNumber(requestBody.minimumSpend) ?? 0,
      advancePercentage: parseNumber(requestBody.advancePercentage) ?? 100,
      category: requestBody.category,
      location: requestBody.location,
      ...coordinates,
      images,
      upiId: requestBody.upiId.trim(),
      cancellationPolicy: typeof requestBody.cancellationPolicy === 'string' ? requestBody.cancellationPolicy.trim() : '',
      refundPolicy: typeof requestBody.refundPolicy === 'string' ? requestBody.refundPolicy.trim() : '',
      serviceTerms: typeof requestBody.serviceTerms === 'string' ? requestBody.serviceTerms.trim() : '',
      deliverables: sanitizeStringList(requestBody.deliverables, 10, 160),
      packages: parsePackagesField(requestBody.packages),
      addOns: parseAddOnsField(requestBody.addOns),
      customQuestions: parseCustomQuestionsField(requestBody.customQuestions),
      organizer: req.user.id,
      availability: parseAvailabilityField(requestBody.availability),
    });

    const populatedService = await service.populate('organizer', getServicePopulate());

    res.status(201).json({
      success: true,
      data: populatedService,
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req: any, res: Response, next: NextFunction) => {
  try {
    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    if (!ensureOrganizerAccess(service, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this service' });
    }

    const coordinates = resolveCoordinates(requestBody, {
      lat: service.lat,
      lng: service.lng,
    });
    const existingImages = parseStringArrayField(requestBody.images);
    const uploadedImages = await getUploadedImages(req.files as Express.Multer.File[] | undefined);
    const images = dedupeImages(
      existingImages.length > 0 || uploadedImages.length > 0 ? existingImages : service.images,
      uploadedImages,
    );

    if (images.length === 0) {
      return res.status(400).json({ success: false, error: 'Please keep at least one image for your service' });
    }

    const availability = parseAvailabilityField(requestBody.availability);

    if (isDevelopmentEnv()) {
      console.log('[service:update:request]', {
        id: req.params.id,
        userId: req.user?.id,
        title: requestBody.title,
        price: requestBody.price,
        bookingMode: requestBody.bookingMode,
        category: requestBody.category,
        location: requestBody.location,
        uploadedImageCount: uploadedImages.length,
        mergedImageCount: images.length,
        availabilityCount: availability.length,
      });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        title: requestBody.title,
        description: requestBody.description,
        price: Number(requestBody.price),
        priceLabel: typeof requestBody.priceLabel === 'string' ? requestBody.priceLabel.trim() : '',
        bookingMode: requestBody.bookingMode === 'quote' ? 'quote' : 'instant',
        minimumSpend: parseNumber(requestBody.minimumSpend) ?? 0,
        advancePercentage: parseNumber(requestBody.advancePercentage) ?? 100,
        category: requestBody.category,
        location: requestBody.location,
        lat: coordinates.lat,
        lng: coordinates.lng,
        images,
        upiId: requestBody.upiId.trim(),
        cancellationPolicy: typeof requestBody.cancellationPolicy === 'string' ? requestBody.cancellationPolicy.trim() : '',
        refundPolicy: typeof requestBody.refundPolicy === 'string' ? requestBody.refundPolicy.trim() : '',
        serviceTerms: typeof requestBody.serviceTerms === 'string' ? requestBody.serviceTerms.trim() : '',
        deliverables: sanitizeStringList(requestBody.deliverables, 10, 160),
        packages: parsePackagesField(requestBody.packages),
        addOns: parseAddOnsField(requestBody.addOns),
        customQuestions: parseCustomQuestionsField(requestBody.customQuestions),
        availability,
      },
      { new: true, runValidators: true },
    ).populate('organizer', getServicePopulate());

    if (isDevelopmentEnv()) {
      console.log('[service:update:response]', {
        id: updatedService?._id,
        title: updatedService?.title,
        price: updatedService?.price,
        bookingMode: updatedService?.bookingMode,
        category: updatedService?.category,
        location: updatedService?.location,
        imageCount: updatedService?.images?.length ?? 0,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedService,
    });
  } catch (error) {
    next(error);
  }
};

export const updateServiceAvailability = async (req: any, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    if (!ensureOrganizerAccess(service, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update availability for this service' });
    }

    service.availability = parseAvailabilityField(req.body.availability) as any;
    await service.save();
    await service.populate('organizer', getServicePopulate());

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

export const getServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: Record<string, unknown> = {};

    if (typeof req.query.category === 'string' && req.query.category.trim()) {
      filters.category = req.query.category.trim();
    }

    if (typeof req.query.organizer === 'string' && req.query.organizer.trim()) {
      filters.organizer = req.query.organizer.trim();
    }

    if (typeof req.query.bookingMode === 'string' && req.query.bookingMode.trim()) {
      filters.bookingMode = req.query.bookingMode.trim();
    }

    if (typeof req.query.location === 'string' && req.query.location.trim()) {
      filters.location = {
        $regex: escapeRegExp(req.query.location.trim()),
        $options: 'i',
      };
    }

    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const searchPattern = escapeRegExp(req.query.search.trim());
      filters.$or = [
        { title: { $regex: searchPattern, $options: 'i' } },
        { description: { $regex: searchPattern, $options: 'i' } },
        { location: { $regex: searchPattern, $options: 'i' } },
        { category: { $regex: searchPattern, $options: 'i' } },
      ];
    }

    const minPrice = parseNumber(req.query.minPrice);
    const maxPrice = parseNumber(req.query.maxPrice);
    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.price = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      };
    }

    const minRating = parseNumber(req.query.minRating);
    if (minRating !== undefined && minRating > 0) {
      filters.rating = { $gte: minRating };
    }

    const sort = normalizeSort(req.query.sort);
    const page = parsePositiveInteger(req.query.page) || 1;
    const limit = parsePositiveInteger(req.query.limit);

    let query = Service.find(filters)
      .populate('organizer', getServicePopulate())
      .sort(sort);

    if (limit) {
      query = query.skip((page - 1) * limit).limit(limit + 20);
    }

    const services = (await query)
      .filter((service) => !isSmokeTestService(service))
      .slice(0, limit || undefined);

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

export const getMappedServices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedLimit = parsePositiveInteger(req.query.limit);
    const limit = requestedLimit ? Math.min(requestedLimit, 250) : 150;

    const services = (await Service.find({
      lat: { $gte: -90, $lte: 90 },
      lng: { $gte: -180, $lte: 180 },
    })
      .select('title location lat lng availability createdAt updatedAt category images')
      .sort({ createdAt: -1 })
      .limit(limit))
      .filter((service) => !isSmokeTestService(service));

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('organizer', getServicePopulate());

    if (!service || isSmokeTestService(service)) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req: any, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    if (!ensureOrganizerAccess(service, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this service' });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
