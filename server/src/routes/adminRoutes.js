import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/stats').get(protect, requireAdmin, getDashboardStats);

export default router;
