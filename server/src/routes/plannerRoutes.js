import express from 'express';
import {
  getPlannerItems,
  updatePlannerItemStatus
} from '../controllers/plannerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getPlannerItems);
router.put('/:itemId', updatePlannerItemStatus);

export default router;
