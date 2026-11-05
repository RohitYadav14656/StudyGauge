import mongoose from 'mongoose';
import {
  getStudyHours,
  getConsistencyMetrics,
  getSyllabusCompletion,
  getSubjectPerformance,
  getTopicAnalyticsWithWeaknessEngine,
  getMockTestPerformance,
  getScoreTrends,
} from './analyticsService.js';
import { getUserReadinessData } from './readinessService.js';
import { getTopicRecommendations } from './recommendationService.js';
import { getDueRevisions } from './revisionService.js';

import UserExam from '../models/UserExam.js';
import Goal from '../models/Goal.js';
import StudySession from '../models/StudySession.js';
import StudyPlan from '../models/StudyPlan.js';
import StudyPlanItem from '../models/StudyPlanItem.js';
import PYQAttempt from '../models/PYQAttempt.js';
import MockTestResult from '../models/MockTestResult.js';
import UserTopicProgress from '../models/UserTopicProgress.js';

const calculateGoalProgress = async (goal, userId) => {
  let currentValue = 0;

  switch (goal.metric) {
    case 'study_hours': {
      const sessions = await StudySession.find({
        userId,
        date: { $gte: goal.startDate, $lte: goal.endDate },
      });
      const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      currentValue = parseFloat((totalMinutes / 60).toFixed(2));
      break;
    }
    case 'topics_completed': {
      currentValue = await UserTopicProgress.countDocuments({
        userId,
        status: 'Completed',
        updatedAt: { $gte: goal.startDate, $lte: goal.endDate },
      });
      break;
    }
    case 'pyqs_attempted': {
      currentValue = await PYQAttempt.countDocuments({
        userId,
        createdAt: { $gte: goal.startDate, $lte: goal.endDate },
      });
      break;
    }
    case 'mock_tests_completed': {
      currentValue = await MockTestResult.countDocuments({
        userId,
        createdAt: { $gte: goal.startDate, $lte: goal.endDate },
      });
      break;
    }
  }

  let status = goal.status;
  if (status === 'in-progress' && currentValue >= goal.targetValue) {
    status = 'achieved';
  } else if (status === 'in-progress' && new Date() > goal.endDate) {
    status = 'failed';
  }

  return {
    _id: goal._id,
    title: goal.title,
    period: goal.period,
    metric: goal.metric,
    targetValue: goal.targetValue,
    currentValue,
    startDate: goal.startDate,
    endDate: goal.endDate,
    status,
  };
};

const userDashboardCache = new Map();
const DASHBOARD_CACHE_TTL_MS = 20 * 1000; // 20 seconds

export const clearDashboardCache = (userId) => {
  if (userId) {
    userDashboardCache.delete(userId.toString());
  }
};

export const getDashboardData = async (userId) => {
  const cacheKey = userId.toString();
  const cached = userDashboardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL_MS) {
    return cached.data;
  }

  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  const activeUserExam = await UserExam.findOne({ userId: userObjId, status: 'active' })
    .populate('examId', 'name description')
    .lean();

  const targetExamId = activeUserExam?.examId?._id?.toString() || null;
  const examName = activeUserExam?.examId?.name || null;
  const targetDate = activeUserExam?.targetDate || null;

  let daysLeft = null;
  if (targetDate) {
    const diffMs = new Date(targetDate).getTime() - now.getTime();
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const filters = { examId: targetExamId };

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    groupA,
    groupB,
    groupC,
    groupD,
    groupE,
    groupF,
    groupG,
  ] = await Promise.all([

    Promise.all([
      getStudyHours(userId, filters).catch(() => null),
      getConsistencyMetrics(userId, 30, filters).catch(() => null),
    ]),

    Promise.all([
      targetExamId ? getSyllabusCompletion(userId, targetExamId).catch(() => null) : null,
      targetExamId ? getUserReadinessData(userId, targetExamId).catch(() => null) : null,
    ]),

    Promise.all([
      getSubjectPerformance(userId, filters).catch(() => null),
      getTopicAnalyticsWithWeaknessEngine(userId, filters).catch(() => null),
    ]),

    Promise.all([
      getMockTestPerformance(userId, filters).catch(() => null),
      getScoreTrends(userId, 90, filters).catch(() => null),
    ]),

    Promise.all([
      getDueRevisions(userId, { examId: targetExamId }).catch(() => null),
      getTopicRecommendations(userId, { ...filters, limit: 5 }).catch(() => null),
    ]),

    (async () => {
      try {
        const goals = await Goal.find({ userId: userObjId, status: 'in-progress' })
          .sort({ endDate: 1 })
          .limit(5)
          .lean();
        return Promise.all(goals.map((g) => calculateGoalProgress(g, userObjId)));
      } catch {
        return [];
      }
    })(),

    Promise.all([

      (async () => {
        try {
          const activePlan = await StudyPlan.findOne({
            userId: userObjId,
            status: 'active',
            ...(targetExamId ? { examId: targetExamId } : {}),
          }).lean();

          if (!activePlan) return [];

          return StudyPlanItem.find({
            studyPlanId: activePlan._id,
            date: { $gte: todayStart, $lte: todayEnd },
          })
            .populate('topicId', 'name')
            .populate('subjectId', 'name')
            .sort({ priority: -1, date: 1 })
            .limit(8)
            .lean();
        } catch {
          return [];
        }
      })(),

      StudySession.find({ userId: userObjId })
        .sort({ date: -1, startTime: -1 })
        .limit(5)
        .populate('subjectId', 'name')
        .populate('topicId', 'name')
        .lean()
        .catch(() => []),
    ]),
  ]);

  const [studyHoursResult, consistencyResult] = groupA;
  const [syllabusResult, readinessResult] = groupB;
  const [subjectPerfResult, topicAnalyticsResult] = groupC;
  const [mockPerfResult, scoreTrendsResult] = groupD;
  const [revisionDueResult, recommendationsResult] = groupE;
  const goalsResult = groupF;
  const [todaysPlanResult, recentActivityResult] = groupG;

  const weakTopics = topicAnalyticsResult
    ? {
        summary: topicAnalyticsResult.summary,
        topics: (topicAnalyticsResult.topics || [])
          .filter((t) => t.classification === 'WEAK')
          .slice(0, 5),
      }
    : { summary: { totalTopics: 0, weakTopics: 0, moderateTopics: 0, strongTopics: 0 }, topics: [] };

  const recentActivity = (recentActivityResult || []).map((s) => ({
    _id: s._id,
    studyType: s.studyType,
    subjectName: s.subjectId?.name || null,
    topicName: s.topicId?.name || null,
    durationMinutes: s.durationMinutes || 0,
    date: s.date,
  }));

  const todaysPlan = (todaysPlanResult || []).map((item) => ({
    _id: item._id,
    title: item.title || item.topicId?.name || 'Study Block',
    topicName: item.topicId?.name || null,
    subjectName: item.subjectId?.name || null,
    activityType: item.activityType,
    priority: item.priority,
    status: item.status,
    plannedDuration: item.plannedDuration,
    actualDuration: item.actualDuration,
    completion: item.completion,
  }));

  const revisionDue = revisionDueResult
    ? {
        dueTodayCount: revisionDueResult.dueTodayCount || 0,
        overdueCount: revisionDueResult.overdueCount || 0,
        totalDue: revisionDueResult.totalDue || 0,
        revisions: (revisionDueResult.revisions || []).slice(0, 5).map((r) => ({
          _id: r._id,
          topicName: r.topicId?.name || 'Unknown',
          subjectName: r.topicId?.subjectId?.name || null,
          status: r.status,
          nextRevisionDate: r.nextRevisionDate,
          revisionCount: r.revisionCount,
        })),
      }
    : { dueTodayCount: 0, overdueCount: 0, totalDue: 0, revisions: [] };

  const dashboardResult = {
    examCountdown: {
      examName,
      targetDate,
      daysLeft,
      hasActiveExam: !!activeUserExam,
    },
    readiness: readinessResult || {
      overallScore: 0,
      confidenceLevel: 'NONE',
      componentScores: {},
      explanationMetadata: { insights: [] },
    },
    studyTime: studyHoursResult || {
      todayHours: 0,
      weeklyHours: 0,
      monthlyHours: 0,
      dailyMinutes: 0,
      weeklyMinutes: 0,
    },
    consistency: consistencyResult || {
      currentStreak: 0,
      currentStreakDays: 0,
      longestStreak: 0,
      consistencyPercentage: 0,
      activeDays: 0,
      totalDays: 30,
    },
    syllabusProgress: syllabusResult || {
      completionPercentage: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      totalTopics: 0,
    },
    subjectPerformance: subjectPerfResult || { subjects: [] },
    weakTopics,
    revisionDue,
    goalProgress: goalsResult || [],
    todaysPlan,
    recommendations: recommendationsResult || {
      meta: { totalRecommendations: 0 },
      recommendations: [],
    },
    recentActivity,
    mockTrend: scoreTrendsResult || [],
    mockPerformance: mockPerfResult?.summary || {
      totalTests: 0,
      avgScorePercentage: 0,
      bestScorePercentage: 0,
    },
  };

  userDashboardCache.set(cacheKey, {
    timestamp: Date.now(),
    data: dashboardResult,
  });

  return dashboardResult;
};
