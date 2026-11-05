import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
