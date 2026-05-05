import type { Response, NextFunction } from 'express';
import PlannerRequest from '../models/PlannerRequest.ts';
import Service from '../models/Service.ts';
import { uploadImageBuffer } from '../utils/cloudinary.ts';
import { createNotification } from '../utils/notifications.ts';
import { recordAuditLog } from '../utils/audit.ts';
import { isSmokeTestService } from '../utils/smokeArtifacts.ts';

const organizerSelect = 'name email role profilePicture bio createdAt upiId businessName businessType businessLocation responseTimeHours verificationStatus verificationNotes verificationSubmittedAt verifiedAt';
const servicePopulate = {
  path: 'shortlist.service',
  populate: { path: 'organizer', select: organizerSelect },
};

const parseNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseStringList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean);
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

const parseLocation = (value: unknown) => {
  const rawValue = typeof value === 'string' && value.trim()
    ? (() => {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return null;
      }
    })()
    : (value && typeof value === 'object' ? value as Record<string, unknown> : null);

  if (!rawValue) {
    return undefined;
  }

  const lat = Number(rawValue.lat);
  const lng = Number(rawValue.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return undefined;
  }

  return { lat, lng };
};

const getServiceStartingPrice = (service: any) => {
  const packagePrices = Array.isArray(service?.packages)
    ? service.packages
      .map((pkg: any) => Number(pkg?.price))
      .filter((price: number) => Number.isFinite(price) && price >= 0)
    : [];

  if (packagePrices.length > 0) {
    return Math.min(...packagePrices);
  }

  return Number(service?.minimumSpend || service?.price || 0);
};

const scoreServiceForPlanner = (
  service: any,
  payload: {
    city: string;
    budgetMin: number;
    budgetMax: number;
    guestCount: number;
    requiredServices: string[];
  },
) => {
  const city = payload.city.trim().toLowerCase();
  const location = typeof service?.location === 'string' ? service.location.toLowerCase() : '';
  const category = typeof service?.category === 'string' ? service.category : 'General';
  const requiredServices = payload.requiredServices.map((item) => item.toLowerCase());
  const matchedCategory = payload.requiredServices.find((item) => item.toLowerCase() === category.toLowerCase()) || '';
  const startingPrice = getServiceStartingPrice(service);
  const reasons: string[] = [];
  let score = 0;

  if (matchedCategory) {
    score += 38;
    reasons.push(`${matchedCategory} match`);
  }

  if (city && location.includes(city)) {
    score += 18;
    reasons.push('Local to requested city');
  }

  if (!city && location) {
    score += 6;
  }

  if (Number.isFinite(Number(service?.rating)) && Number(service.rating) > 0) {
    score += Number(service.rating) * 8;
  } else {
    score += 4;
  }

  if (service?.organizer?.verificationStatus === 'verified') {
    score += 12;
    reasons.push('Verified organizer');
  }

  if (startingPrice >= payload.budgetMin && startingPrice <= payload.budgetMax) {
    score += 18;
    reasons.push('Within target budget');
  } else if (startingPrice <= payload.budgetMax * 1.15) {
    score += 8;
    reasons.push('Close to target budget');
  }

  const guestFit = Array.isArray(service?.packages)
    && service.packages.some((pkg: any) => Number(pkg?.guestLimit || 0) >= payload.guestCount);

  if (guestFit) {
    score += 7;
    reasons.push('Package fits guest count');
  }

  if (service?.bookingMode === 'quote') {
    score += 5;
  }

  if (!matchedCategory && requiredServices.length > 0) {
    score -= 10;
  }

  return {
    service: service._id,
    matchedCategory,
    score,
    reason: reasons.slice(0, 3).join(' | ') || 'Strong general match for your brief.',
    basePrice: startingPrice,
  };
};

const populatePlannerRequestById = async (plannerRequestId: string) => (
  PlannerRequest.findById(plannerRequestId)
    .populate(servicePopulate)
    .populate('user', 'name email role profilePicture')
);

const buildShortlist = async (payload: {
  city: string;
  budgetMin: number;
  budgetMax: number;
  guestCount: number;
  requiredServices: string[];
}) => {
  const filters: Record<string, unknown> = {};

  if (payload.city.trim()) {
    filters.location = {
      $regex: payload.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    };
  }

  if (payload.requiredServices.length > 0) {
    filters.category = { $in: payload.requiredServices };
  }

  const services = (await Service.find(filters)
    .populate('organizer', organizerSelect)
    .sort({ rating: -1, reviews: -1, createdAt: -1 })
    .limit(40))
    .filter((service) => !isSmokeTestService(service));

  const scored = services
    .map((service) => scoreServiceForPlanner(service, payload))
    .filter((entry) => entry.score >= (payload.requiredServices.length > 0 ? 20 : 16))
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  return scored;
};

export const createPlannerRequest = async (req: any, res: Response, next: NextFunction) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const budgetMin = Math.max(0, parseNumber(body.budgetMin));
    const budgetMax = Math.max(budgetMin, parseNumber(body.budgetMax));
    const requiredServices = parseStringList(body.requiredServices).slice(0, 8);
    const attachments = await Promise.all(
      ((req.files as Express.Multer.File[] | undefined) || []).map((file) => (
        uploadImageBuffer(file.buffer, file.originalname, 'planner')
      )),
    );

    const shortlist = await buildShortlist({
      city: typeof body.city === 'string' ? body.city : '',
      budgetMin,
      budgetMax,
      guestCount: Math.max(1, parseNumber(body.guestCount, 1)),
      requiredServices,
    });

    const plannerRequest = await PlannerRequest.create({
      user: req.user?._id || null,
      name: typeof body.name === 'string' ? body.name.trim() : req.user?.name || '',
      email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : req.user?.email || '',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      city: typeof body.city === 'string' ? body.city.trim() : '',
      eventDate: body.eventDate,
      guestCount: Math.max(1, parseNumber(body.guestCount, 1)),
      budgetMin,
      budgetMax,
      vibe: typeof body.vibe === 'string' ? body.vibe.trim() : '',
      eventType: typeof body.eventType === 'string' && body.eventType.trim() ? body.eventType.trim() : 'General Event',
      requiredServices,
      notes: typeof body.notes === 'string' ? body.notes.trim() : '',
      attachmentUrls: attachments,
      serviceLocation: parseLocation(body.serviceLocation),
      status: shortlist.length > 0 ? 'shortlisted' : 'new',
      shortlist,
    });

    const populatedPlannerRequest = await populatePlannerRequestById(plannerRequest._id.toString());
    const organizerIds = new Set<string>();

    if (populatedPlannerRequest?.shortlist?.length) {
      populatedPlannerRequest.shortlist.forEach((entry: any) => {
        const organizerId = entry?.service?.organizer?._id?.toString?.();
        if (organizerId) {
          organizerIds.add(organizerId);
        }
      });
    }

    await Promise.all([
      ...Array.from(organizerIds).map((organizerId) => (
        createNotification({
          user: organizerId,
          type: 'system',
          title: 'New planner lead matched',
          message: `${plannerRequest.name} is planning a ${plannerRequest.eventType} in ${plannerRequest.city}.`,
          link: '/dashboard/seller',
          metadata: {
            plannerRequestId: plannerRequest._id.toString(),
          },
        })
      )),
      recordAuditLog({
        actor: req.user?._id?.toString?.() || null,
        role: req.user?.role || 'guest',
        action: 'planner.request.created',
        entityType: 'plannerRequest',
        entityId: plannerRequest._id.toString(),
        status: 'success',
        summary: `Planner request created for ${plannerRequest.city}.`,
        metadata: {
          shortlistCount: shortlist.length,
          requiredServices,
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      data: populatedPlannerRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPlannerRequests = async (req: any, res: Response, next: NextFunction) => {
  try {
    const plannerRequests = await PlannerRequest.find({ user: req.user.id })
      .populate(servicePopulate)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plannerRequests.length,
      data: plannerRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizerPlannerLeads = async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizerServices = await Service.find({ organizer: req.user.id }).select('_id');
    const serviceIds = organizerServices.map((service) => service._id);
    const plannerRequests = await PlannerRequest.find({
      'shortlist.service': { $in: serviceIds },
    })
      .populate(servicePopulate)
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: plannerRequests.length,
      data: plannerRequests,
    });
  } catch (error) {
    next(error);
  }
};
