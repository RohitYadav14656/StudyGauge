import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  updateSubjectStatus
} from '../controllers/subjectController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getSubjects)
  .post(protect, requireAdmin, createSubject);

router.route('/:id')
  .get(getSubjectById)
  .put(protect, requireAdmin, updateSubject);

router.route('/:id/status')
  .patch(protect, requireAdmin, updateSubjectStatus);

export default router;
