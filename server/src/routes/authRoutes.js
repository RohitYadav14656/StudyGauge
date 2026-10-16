import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/authValidation.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, validate(updateProfileSchema), updateUserProfile);

export default router;
