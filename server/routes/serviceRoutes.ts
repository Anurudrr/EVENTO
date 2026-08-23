import express from 'express';
import multer from 'multer';
import {
  createService,
  deleteService,
  getMappedServices,
  getServiceById,
  getServices,
  updateService,
  updateServiceAvailability,
} from '../controllers/serviceController.ts';
import { protect, requireOrganizer } from '../middleware/authMiddleware.ts';
import { validateAvailability, validateCreateService } from '../middleware/validationMiddleware.ts';
import { checkImageFile } from '../utils/upload.ts';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
  fileFilter(req, file, cb) {
    checkImageFile(file, cb);
  },
});

router.route('/')
  .get(getServices)
  .post(protect, requireOrganizer, upload.array('images', 6), validateCreateService, createService);

router.get('/map', getMappedServices);

router.route('/:id')
  .get(getServiceById)
  .put(protect, requireOrganizer, upload.array('images', 6), validateCreateService, updateService)
  .delete(protect, requireOrganizer, deleteService);

router.put('/:id/availability', protect, requireOrganizer, validateAvailability, updateServiceAvailability);

export default router;
