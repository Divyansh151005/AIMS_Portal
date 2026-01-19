import express from 'express';
import { authenticate, requireRole, requireActive } from '../middleware/auth.js';
import {
  getTimetable,
  initializeTimetable,
} from '../controllers/timetableController.js';

const router = express.Router();

// Public route for timetable initialization (admin only in production)
router.post('/initialize', initializeTimetable);

// Protected routes
router.use(authenticate);

router.get('/', getTimetable);

export default router;
