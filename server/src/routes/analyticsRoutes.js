import express from 'express';
import {
  getOverview,
  getSubjects,
  getTopics,
  getTests,
  getStudy,
  getReadinessScore,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', protect, getOverview);
router.get('/readiness', protect, getReadinessScore);
router.get('/subjects', protect, getSubjects);
router.get('/topics', protect, getTopics);
router.get('/tests', protect, getTests);
router.get('/study', protect, getStudy);

export default router;

