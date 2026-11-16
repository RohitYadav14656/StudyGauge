import { getDashboardData } from '../services/dashboardService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const requestedExamId = req.query.examId || null;
    const data = await getDashboardData(userId, requestedExamId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
