import express from 'express';
import {
  getAdminOverview,
  deleteServiceAsAdmin,
  approvePaymentAsAdmin,
  rejectPaymentAsAdmin,
} from '../controllers/adminController.ts';
import { authorize, protect } from '../middleware/authMiddleware.ts';
import { validateAdminPaymentDecision } from '../middleware/validationMiddleware.ts';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/overview', getAdminOverview);
router.delete('/services/:id', deleteServiceAsAdmin);
router.put('/payments/:id/approve', approvePaymentAsAdmin);
router.put('/payments/:id/reject', validateAdminPaymentDecision, rejectPaymentAsAdmin);

export default router;
