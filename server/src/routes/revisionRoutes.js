import express from 'express';
import {
  getDueRevisionsController,
  createOrUpdateRevisionController,
  seedDemoRevisionsController,
  getAllRevisionsController,
} from '../controllers/revisionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/due', protect, getDueRevisionsController);
router.get('/all', protect, getAllRevisionsController);
router.post('/seed-demo', protect, seedDemoRevisionsController);
router.post('/', protect, createOrUpdateRevisionController);

export default router;
