import { getActivityTimeline, ACTIVITY_TYPES } from '../services/activityTimelineService.js';

export const getTimeline = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, types, page, limit } = req.query;

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
