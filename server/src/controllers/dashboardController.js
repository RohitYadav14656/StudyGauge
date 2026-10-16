import { getDashboardData } from '../services/dashboardService.js';

/**
 * @desc    Get aggregated dashboard data (single endpoint)
 * @route   GET /api/dashboard
 * @access  Private
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = await getDashboardData(userId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
