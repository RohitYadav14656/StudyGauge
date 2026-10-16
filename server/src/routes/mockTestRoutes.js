import express from 'express';
import {
  createMockTest,
  getMockTests,
  getMockTestById,
} from '../controllers/mockTestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createMockTestSchema } from '../validations/mockTestValidation.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(validate(createMockTestSchema), createMockTest)
  .get(getMockTests);

router.route('/:id').get(getMockTestById);

export default router;
