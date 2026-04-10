import express from 'express';
import multer from 'multer';
import {
  getProfile,
  uploadProfilePicture,
  updateProfile,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  toggleWishlist,
} from '../controllers/userController.ts';
import { protect } from '../middleware/authMiddleware.ts';

const router = express.Router();

const checkImageFile = (file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png/;
  const hasValidExtension = allowedTypes.test(file.originalname.split('.').pop()?.toLowerCase() || '');
  const hasValidMimeType = allowedTypes.test(file.mimetype);

  if (hasValidExtension && hasValidMimeType) {
    return cb(null, true);
  }

  cb(new Error('Images only!'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    checkImageFile(file, cb);
  },
});
const profilePictureUpload = upload.single('profilePic');

router.use(protect);

router.get('/profile', getProfile);
router.post('/upload-pfp', profilePictureUpload, uploadProfilePicture);
router.put('/profile', updateProfile);
router.get('/wishlist', getWishlist);
router.put('/wishlist/:serviceId/toggle', toggleWishlist);
router.post('/wishlist/:serviceId', addToWishlist);
router.delete('/wishlist/:serviceId', removeFromWishlist);

export default router;
