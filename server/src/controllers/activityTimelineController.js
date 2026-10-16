import { getActivityTimeline, ACTIVITY_TYPES } from '../services/activityTimelineService.js';

/**
 * @desc    Get unified activity timeline
 * @route   GET /api/activity-timeline
 * @access  Private
 *
 * Query params:
 *   startDate  - ISO date (lower bound)
 *   endDate    - ISO date (upper bound)
 *   types      - Comma-separated activity types (or array after validation)
 *   page       - Page number (default 1)
 *   limit      - Items per page (default 20, max 50)
 */
export const getTimeline = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, types, page, limit } = req.query;

    // `types` is either an array (after Joi custom transform) or a raw
    // comma-separated string if validation middleware is bypassed.
    let typesArray;
    if (Array.isArray(types)) {
      typesArray = types;
    } else if (typeof types === 'string') {
      typesArray = types.split(',').map((t) => t.trim()).filter(Boolean);
    } else {
      typesArray = undefined;
    }

    const result = await getActivityTimeline(userId, {
      startDate,
      endDate,
      types: typesArray,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    res.json({
      success: true,
      data: result.activities,
      pagination: result.pagination,
      availableTypes: ACTIVITY_TYPES,
    });
  } catch (error) {
    next(error);
  }
};
