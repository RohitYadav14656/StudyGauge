import express from 'express';
import {
  explainTopic,
  generateQuestions,
  getStudyAdvice,
  askQuestion,
  getUsageStats,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/explain', explainTopic);
router.post('/questions', generateQuestions);
router.post('/study-advice', getStudyAdvice);
router.post('/ask', askQuestion);
router.get('/usage-stats', getUsageStats);

export default router;
