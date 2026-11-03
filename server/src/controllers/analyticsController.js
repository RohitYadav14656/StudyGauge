import {
  getStudyHours,
  getDailyStudyHours,
  getConsistencyMetrics,
  getSyllabusCompletion,
  getSubjectPerformance,
  getTopicPerformance,
  getTopicAnalyticsWithWeaknessEngine,
  getPYQAccuracy,
  getMockTestPerformance,
  getScoreTrends,
  getAccuracyTrends,
  getStudyTypeDistribution,
} from '../services/analyticsService.js';
import { getUserReadinessData } from '../services/readinessService.js';
import UserExam from '../models/UserExam.js';

export const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { dateRange, examId, subjectId, startDate, endDate } = req.query;

    let targetExamId = examId;
    if (!targetExamId) {
      const activeExam = await UserExam.findOne({ userId, status: 'active' }).lean();
      targetExamId = activeExam?.examId;
    }

    const filters = { dateRange, examId: targetExamId, subjectId, startDate, endDate };

    const [studyHours, consistency, syllabusCompletion, pyqAccuracy, mockTestPerf, topicAnalytics] =
      await Promise.all([
        getStudyHours(userId, filters),
        getConsistencyMetrics(userId, 30, filters),
        getSyllabusCompletion(userId, targetExamId),
        getPYQAccuracy(userId, filters),
        getMockTestPerformance(userId, filters),
        getTopicAnalyticsWithWeaknessEngine(userId, filters),
      ]);

    res.json({
      success: true,
      data: {
        studyHours,
        consistency,
        syllabusCompletion,
        pyqAccuracy: pyqAccuracy.overall,
        mockTestPerformance: mockTestPerf.summary,
        mockTestSummary: mockTestPerf.summary,
        weakTopicsSummary: topicAnalytics.summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { dateRange, examId, subjectId, startDate, endDate } = req.query;
    const filters = { dateRange, examId, subjectId, startDate, endDate };

    const subjectPerformance = await getSubjectPerformance(userId, filters);

    res.json({
      success: true,
      data: subjectPerformance,
    });
  } catch (error) {
    next(error);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { dateRange, examId, subjectId, startDate, endDate, classification } = req.query;
    const filters = { dateRange, examId, subjectId, startDate, endDate, classification };

    const topicAnalytics = await getTopicAnalyticsWithWeaknessEngine(userId, filters);

    res.json({
      success: true,
      data: topicAnalytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getTests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { dateRange, examId, subjectId, startDate, endDate, days: daysParam } = req.query;
    const days = Math.min(365, Math.max(7, Number(daysParam) || 90));
    const filters = { dateRange: dateRange || `${days}d`, examId, subjectId, startDate, endDate };

    const [mockTestPerf, scoreTrends, accuracyTrends, pyqAccuracy] =
      await Promise.all([
        getMockTestPerformance(userId, filters),
        getScoreTrends(userId, days, filters),
        getAccuracyTrends(userId, days, filters),
        getPYQAccuracy(userId, filters),
      ]);

    res.json({
      success: true,
      data: {
        performance: mockTestPerf.summary,
        mockTest: mockTestPerf,
        scoreTrends,
        accuracyTrends,
        pyqAccuracy,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudy = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { dateRange, examId, subjectId, startDate, endDate, days: daysParam, period } = req.query;

    const effectiveDateRange = dateRange || period || '30d';
    const days = Math.min(365, Math.max(7, Number(daysParam) || (effectiveDateRange === '7d' ? 7 : 30)));
    const filters = { dateRange: effectiveDateRange, examId, subjectId, startDate, endDate };

    const [studyHours, dailyBreakdown, consistency, typeDistribution] =
      await Promise.all([
        getStudyHours(userId, filters),
        getDailyStudyHours(userId, days, filters),
        getConsistencyMetrics(userId, days, filters),
        getStudyTypeDistribution(userId, days, filters),
      ]);

    res.json({
      success: true,
      data: {
        hours: studyHours,
        studyHours,
        dailyBreakdown,
        consistency,
        typeDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReadinessScore = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { examId } = req.query;

    let targetExamId = examId;
    if (!targetExamId) {
      const activeExam = await UserExam.findOne({ userId, status: 'active' }).lean();
      targetExamId = activeExam?.examId;
    }

    const readinessResult = await getUserReadinessData(userId, targetExamId);

    res.json({
      success: true,
      data: readinessResult,
    });
  } catch (error) {
    next(error);
  }
};

