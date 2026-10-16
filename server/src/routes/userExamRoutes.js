import express from 'express';
import {
  getUserExams,
  selectExams,
  updateUserExam,
  getUserTopicProgress,
  updateUserTopicProgress,
  getExamProgressAnalytics
} from '../controllers/userExamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getUserExams);

router.route('/batch')
  .post(protect, selectExams);

router.route('/:id')
  .put(protect, updateUserExam);

router.route('/:examId/progress')
  .get(protect, getUserTopicProgress);

router.route('/:examId/progress/analytics')
  .get(protect, getExamProgressAnalytics);

router.route('/:examId/topics/:topicId/progress')
  .put(protect, updateUserTopicProgress);

export default router;
