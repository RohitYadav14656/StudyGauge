import express from 'express';
import { getCurrentUser, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validations/authValidation.js';

const router = express.Router();

router.use(protect);

router.get('/me', getCurrentUser);
router.put('/me', validate(updateProfileSchema), updateUserProfile);

export default router;

