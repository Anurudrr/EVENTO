import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.ts';
import { uploadImageBuffer } from '../utils/cloudinary.ts';

const router = express.Router();

function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(file.originalname.split('.').pop()?.toLowerCase() || '');
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'));
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

const profileUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'profilePic', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 },
]);

const getUploadedFile = (req: express.Request & { files?: any; file?: Express.Multer.File }) => {
  if (req.file) {
    return req.file;
  }

  const fileGroups = req.files as Record<string, Express.Multer.File[]> | undefined;
  return fileGroups?.profilePic?.[0] || fileGroups?.image?.[0] || fileGroups?.profilePicture?.[0];
};

const toPublicFileUrl = (req: express.Request, value: string) => {
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

const handleUpload = async (
  req: express.Request & { files?: any; file?: Express.Multer.File },
  res: express.Response,
  folder: 'events' | 'profiles'
) => {
  const uploadedFile = getUploadedFile(req);

  if (!uploadedFile) {
    return res.status(400).json({ success: false, error: 'Please upload a file' });
  }

  const imageUrl = await uploadImageBuffer(uploadedFile.buffer, uploadedFile.originalname, folder);

  return res.status(200).json({
    success: true,
    imageUrl: toPublicFileUrl(req, imageUrl),
    data: toPublicFileUrl(req, imageUrl),
  });
};

router.post('/', protect, authorize('organizer', 'admin'), upload.single('image'), async (req, res, next) => {
  try {
    await handleUpload(req, res, 'events');
  } catch (error) {
    next(error);
  }
});

router.post('/profile', protect, profileUpload, async (req, res, next) => {
  try {
    await handleUpload(req, res, 'profiles');
  } catch (error) {
    next(error);
  }
});

export default router;
