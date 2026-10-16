import express from 'express';
import {
  getDueRevisionsController,
  createOrUpdateRevisionController,
} from '../controllers/revisionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/due', protect, getDueRevisionsController);
router.post('/', protect, createOrUpdateRevisionController);

export default router;
