import type { Request, Response, NextFunction } from 'express';
import Service from '../models/Service.ts';
import { uploadImageBuffer } from '../utils/cloudinary.ts';
import { toDateKey } from '../utils/date.ts';
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

const parsePositiveInteger = (value: unknown) => {
  const parsed = parseNumber(value);

  if (parsed === undefined || !Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

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
  'name email role profilePicture bio createdAt upiId'
);

const ensureOrganizerAccess = (service: any, user: any) => {
  return service.organizer.toString() === user.id || user.role === 'admin';
};

export const createService = async (req: any, res: Response, next: NextFunction) => {
  try {
    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
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
      category: requestBody.category,
      location: requestBody.location,
      images,
      upiId: requestBody.upiId.trim(),
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

    console.log('[service:update:request]', {
      id: req.params.id,
      userId: req.user?.id,
      body: {
        title: requestBody.title,
        description: requestBody.description,
        price: requestBody.price,
        category: requestBody.category,
        location: requestBody.location,
        upiId: requestBody.upiId,
        images: existingImages,
        availabilityCount: availability.length,
      },
      uploadedImageCount: uploadedImages.length,
      mergedImageCount: images.length,
    });

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      {
        title: requestBody.title,
        description: requestBody.description,
        price: Number(requestBody.price),
        priceLabel: typeof requestBody.priceLabel === 'string' ? requestBody.priceLabel.trim() : '',
        category: requestBody.category,
        location: requestBody.location,
        images,
        upiId: requestBody.upiId.trim(),
        availability,
      },
      { new: true, runValidators: true },
    ).populate('organizer', getServicePopulate());

    console.log('[service:update:response]', {
      id: updatedService?._id,
      title: updatedService?.title,
      price: updatedService?.price,
      category: updatedService?.category,
      location: updatedService?.location,
      imageCount: updatedService?.images?.length ?? 0,
      upiId: updatedService?.upiId,
    });

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
