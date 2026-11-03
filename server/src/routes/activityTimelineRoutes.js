import express from 'express';
import { getTimeline } from '../controllers/activityTimelineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { activityTimelineQuerySchema } from '../validations/activityTimelineValidation.js';

const router = express.Router();

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    res.status(400);
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return next(new Error(`Validation error: ${errorMessage}`));
  }
  req.query = value;
  next();
};

router.get('/', protect, validateQuery(activityTimelineQuerySchema), getTimeline);

export default router;
