import express from 'express';
import {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  updateTopicStatus
} from '../controllers/topicController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getTopics)
  .post(protect, requireAdmin, createTopic);

router.route('/:id')
  .get(getTopicById)
  .put(protect, requireAdmin, updateTopic);

router.route('/:id/status')
  .patch(protect, requireAdmin, updateTopicStatus);

export default router;
