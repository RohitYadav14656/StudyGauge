import Joi from 'joi';

/**
 * Validation schema for GET /api/activity-timeline query parameters.
 *
 * Validates via the query-string middleware (not body), so we use
 * `validateQuery` in the route rather than `validate`.
 */
export const activityTimelineQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional().when('startDate', {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref('startDate')),
  }),
  types: Joi.string()
    .optional()
    .custom((value) => {
      // Accept comma-separated values, split and validate each
      const arr = value.split(',').map((v) => v.trim()).filter(Boolean);
      const allowed = ['study_session', 'mock_test', 'pyq_attempt', 'revision', 'planner_item'];
      const invalid = arr.filter((v) => !allowed.includes(v));
      if (invalid.length > 0) {
        throw new Error(`Invalid activity type(s): ${invalid.join(', ')}`);
      }
      return arr;
    }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
});
