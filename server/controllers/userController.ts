import type { Response, NextFunction } from 'express';
import User from '../models/User.ts';
import Service from '../models/Service.ts';
import Wishlist from '../models/Wishlist.ts';
import { uploadImageBuffer } from '../utils/cloudinary.ts';
import { isSmokeTestService } from '../utils/smokeArtifacts.ts';

const wishlistPopulate = {
  path: 'serviceIds',
  populate: {
    path: 'organizer',
    select: 'name email role profilePicture bio createdAt upiId',
  },
};

const getUploadedFile = (req: any): Express.Multer.File | null => {
  if (req.file) {
    return req.file as Express.Multer.File;
  }

  const requestFiles = req.files;
  if (!requestFiles) {
    return null;
  }

  if (Array.isArray(requestFiles)) {
    return (requestFiles[0] as Express.Multer.File) || null;
  }

  const fileGroups = requestFiles as Record<string, Express.Multer.File[]>;
  return fileGroups.profilePic?.[0] || fileGroups.image?.[0] || fileGroups.profilePicture?.[0] || null;
};

const toPublicFileUrl = (req: any, value: string) => {
  if (!value || /^https?:\/\//i.test(value)) {
    return value;
  }

  const protocol = req.headers['x-forwarded-proto']?.toString().split(',')[0]?.trim() || req.protocol || 'http';
  const host = req.get('host');

  if (!host) {
    return value;
  }

  return `${protocol}://${host}${value.startsWith('/') ? value : `/${value}`}`;
};

const serializeUser = (req: any, user: any) => {
  const rawUser = typeof user?.toObject === 'function' ? user.toObject() : user;

  return {
    ...rawUser,
    profilePicture: rawUser?.profilePicture ? toPublicFileUrl(req, rawUser.profilePicture) : '',
  };
};

const getOrCreateWishlist = async (userId: string) => {
  let wishlist = await Wishlist.findOne({ userId }).populate(wishlistPopulate);

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, serviceIds: [] });
    wishlist = await Wishlist.findOne({ userId }).populate(wishlistPopulate);
  }

  return wishlist;
};

export const getProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const [user, wishlist] = await Promise.all([
      User.findById(req.user.id),
      getOrCreateWishlist(req.user.id),
    ]);
    const visibleWishlist = (wishlist?.serviceIds || []).filter((service: any) => !isSmokeTestService(service));

    res.status(200).json({
      success: true,
      data: {
        ...serializeUser(req, user),
        wishlist: visibleWishlist,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadProfilePicture = async (req: any, res: Response, next: NextFunction) => {
  try {
    console.log('[user:upload-pfp]', req.originalUrl);
    const uploadedFile = getUploadedFile(req);

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an image file',
      });
    }

    const profilePicture = await uploadImageBuffer(uploadedFile.buffer, uploadedFile.originalname, 'profiles');

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      imageUrl: toPublicFileUrl(req, profilePicture),
      data: serializeUser(req, user),
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
    const uploadedFile = getUploadedFile(req);

    let profilePicture = typeof requestBody.profilePicture === 'string'
      ? requestBody.profilePicture.trim()
      : undefined;

    if (uploadedFile) {
      profilePicture = await uploadImageBuffer(uploadedFile.buffer, uploadedFile.originalname, 'profiles');
    }

    if (profilePicture?.startsWith('data:')) {
      return res.status(400).json({
        success: false,
        error: 'Profile picture must be uploaded before saving your profile',
      });
    }

    const fieldsToUpdate = {
      ...(typeof requestBody.name === 'string' ? { name: requestBody.name.trim() } : {}),
      ...(typeof requestBody.bio === 'string' ? { bio: requestBody.bio.trim() } : {}),
      ...(typeof requestBody.upiId === 'string' ? { upiId: requestBody.upiId.trim() } : {}),
      ...(profilePicture !== undefined ? { profilePicture } : {}),
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: serializeUser(req, user),
    });
  } catch (err) {
    next(err);
  }
};

export const addToWishlist = async (req: any, res: Response, next: NextFunction) => {
  try {
    const serviceId = req.params.serviceId || req.params.eventId;
    const service = await Service.findById(serviceId);

    if (!service || isSmokeTestService(service)) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const wishlist = await getOrCreateWishlist(req.user.id);

    if (wishlist?.serviceIds.some((id: any) => id.toString() === serviceId)) {
      return res.status(400).json({ success: false, error: 'Service already in wishlist' });
    }

    wishlist?.serviceIds.push(serviceId);
    await wishlist?.save();
    await wishlist?.populate(wishlistPopulate);

    res.status(200).json({
      success: true,
      data: wishlist?.serviceIds || [],
    });
  } catch (err) {
    next(err);
  }
};

export const removeFromWishlist = async (req: any, res: Response, next: NextFunction) => {
  try {
    const serviceId = req.params.serviceId || req.params.eventId;
    const wishlist = await getOrCreateWishlist(req.user.id);

    if (wishlist) {
      wishlist.serviceIds = wishlist.serviceIds.filter(
        (id: any) => id.toString() !== serviceId,
      );
      await wishlist.save();
      await wishlist.populate(wishlistPopulate);
    }

    res.status(200).json({
      success: true,
      data: wishlist?.serviceIds || [],
    });
  } catch (err) {
    next(err);
  }
};

export const toggleWishlist = async (req: any, res: Response, next: NextFunction) => {
  try {
    const serviceId = req.params.serviceId || req.params.eventId;
    const service = await Service.findById(serviceId);

    if (!service || isSmokeTestService(service)) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const wishlist = await getOrCreateWishlist(req.user.id);

    if (!wishlist) {
      return res.status(500).json({ success: false, error: 'Unable to update wishlist' });
    }

    const exists = wishlist.serviceIds.some((id: any) => id.toString() === serviceId);

    if (exists) {
      wishlist.serviceIds = wishlist.serviceIds.filter((id: any) => id.toString() !== serviceId);
    } else {
      wishlist.serviceIds.push(serviceId);
    }

    await wishlist.save();
    await wishlist.populate(wishlistPopulate);

    res.status(200).json({
      success: true,
      data: {
        saved: !exists,
        serviceIds: wishlist.serviceIds,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getWishlist = async (req: any, res: Response, next: NextFunction) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    const serviceIds = (wishlist?.serviceIds || []).filter((service: any) => !isSmokeTestService(service));

    res.status(200).json({
      success: true,
      count: serviceIds.length,
      data: serviceIds,
    });
  } catch (err) {
    next(err);
  }
};
