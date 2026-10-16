import express from 'express';
import {
  createGoal,
  getGoals,
  updateGoal,
} from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createGoalSchema,
  updateGoalSchema,
} from '../validations/goalValidation.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(validate(createGoalSchema), createGoal)
  .get(getGoals);

router
  .route('/:id')
  .put(validate(updateGoalSchema), updateGoal);

export default router;
