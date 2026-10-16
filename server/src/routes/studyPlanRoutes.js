import express from 'express';
import {
  createStudyPlan,
  getStudyPlans,
  getStudyPlanById,
  createStudyPlanItem,
  getStudyPlanItems,
  updateStudyPlanItem,
  deleteStudyPlanItem,
  generateStudyPlan,
  analyzeStudyPlanProgress,
  adaptStudyPlanController,
} from '../controllers/studyPlanController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createStudyPlanSchema,
  createStudyPlanItemSchema,
  updateStudyPlanItemSchema,
  generateStudyPlanSchema,
  adaptStudyPlanSchema,
} from '../validations/studyPlanValidation.js';

const router = express.Router();

router.use(protect);

router.post('/generate', validate(generateStudyPlanSchema), generateStudyPlan);

router
  .route('/')
  .post(validate(createStudyPlanSchema), createStudyPlan)
  .get(getStudyPlans);

router.route('/:id').get(getStudyPlanById);

router.get('/:planId/adapt/analysis', analyzeStudyPlanProgress);
router.post('/:planId/adapt', validate(adaptStudyPlanSchema), adaptStudyPlanController);

router
  .route('/:planId/items')
  .post(validate(createStudyPlanItemSchema), createStudyPlanItem)
  .get(getStudyPlanItems);

router
  .route('/items/:itemId')
  .put(validate(updateStudyPlanItemSchema), updateStudyPlanItem)
  .delete(deleteStudyPlanItem);

export default router;

