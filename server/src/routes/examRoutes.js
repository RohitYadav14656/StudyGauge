import express from 'express';
import { getExams, getExamById, createExam, updateExam, getExamSyllabus } from '../controllers/examController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getExams)
  .post(protect, requireAdmin, createExam);

router.route('/:id')
  .get(getExamById)
  .put(protect, requireAdmin, updateExam);

router.route('/:examId/syllabus')
  .get(getExamSyllabus);

export default router;
