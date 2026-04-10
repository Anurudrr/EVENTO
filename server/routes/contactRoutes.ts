import express from 'express';
import { createContactMessage } from '../controllers/contactController.ts';
import { validateContact } from '../middleware/validationMiddleware.ts';

const router = express.Router();

router.post('/', validateContact, createContactMessage);

export default router;
