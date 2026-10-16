import express from 'express';
import {
  createStudySession,
  getStudySessions,
  updateStudySession,
  deleteStudySession,
} from '../controllers/studySessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createStudySessionSchema,
  updateStudySessionSchema,
} from '../validations/studySessionValidation.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(validate(createStudySessionSchema), createStudySession)
  .get(getStudySessions);

router
  .route('/:id')
  .put(validate(updateStudySessionSchema), updateStudySession)
  .delete(deleteStudySession);

export default router;
