import express from 'express';
import {
  getPYQs,
  getPYQ,
  attemptPYQ,
  getPYQStats,
  toggleBookmark,
  toggleRevision,
  getBookmarks,
  getRevisionList,
  getAttempts,
} from '../controllers/pyqController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Static routes MUST come before /:id routes to avoid route conflicts
router.get('/stats', protect, getPYQStats);
router.get('/bookmarks', protect, getBookmarks);
router.get('/revision', protect, getRevisionList);
router.get('/attempts', protect, getAttempts);

// Parameterized routes
router.get('/', protect, getPYQs);
router.get('/:id', protect, getPYQ);
router.post('/:id/attempt', protect, attemptPYQ);
router.patch('/:id/bookmark', protect, toggleBookmark);
router.patch('/:id/revision', protect, toggleRevision);

export default router;
