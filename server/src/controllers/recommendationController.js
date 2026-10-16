import { getTopicRecommendations } from '../services/recommendationService.js';
import UserExam from '../models/UserExam.js';

/**
 * Controller handler for topic recommendations
 */

// @desc    Get prioritized topic recommendations
// @route   GET /api/recommendations
// @access  Private
export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { examId, subjectId, availableTime, limit, minPriority } = req.query;

    let targetExamId = examId;
    if (!targetExamId) {
      const activeExam = await UserExam.findOne({ userId, status: 'active' }).lean();
      if (activeExam?.examId) {
        targetExamId = activeExam.examId.toString();
      }
    }

    const filters = {
      examId: targetExamId,
      subjectId,
      availableTime,
      limit,
      minPriority,
    };

    const recommendationData = await getTopicRecommendations(userId, filters);

    res.json({
      success: true,
      data: recommendationData,
    });
  } catch (error) {
    next(error);
  }
};
