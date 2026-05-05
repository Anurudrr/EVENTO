import express from 'express';
import {
  getAdminOverview,
  deleteServiceAsAdmin,
  approvePaymentAsAdmin,
  rejectPaymentAsAdmin,
  approveOrganizerVerificationAsAdmin,
  rejectOrganizerVerificationAsAdmin,
} from '../controllers/adminController.ts';
import { authorize, protect } from '../middleware/authMiddleware.ts';
import { validateAdminOrganizerDecision, validateAdminPaymentDecision } from '../middleware/validationMiddleware.ts';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/overview', getAdminOverview);
router.delete('/services/:id', deleteServiceAsAdmin);
router.put('/payments/:id/approve', approvePaymentAsAdmin);
router.put('/payments/:id/reject', validateAdminPaymentDecision, rejectPaymentAsAdmin);
router.put('/organizers/:id/approve', validateAdminOrganizerDecision, approveOrganizerVerificationAsAdmin);
router.put('/organizers/:id/reject', validateAdminOrganizerDecision, rejectOrganizerVerificationAsAdmin);

export default router;
