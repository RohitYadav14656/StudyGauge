import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import PYQAttempt from '../models/PYQAttempt.js';
import MockTest from '../models/MockTest.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Revision from '../models/Revision.js';

export const parseDateFilter = (dateRange, startDateStr, endDateStr) => {
  let startDate = null;
  let endDate = null;

  if (startDateStr) {
    startDate = new Date(startDateStr);
  }
  if (endDateStr) {
    endDate = new Date(endDateStr);
  }

  if (!startDate && dateRange && dateRange !== 'all') {
    const now = new Date();
    startDate = new Date();
    if (dateRange === '7d') startDate.setDate(now.getDate() - 7);
    else if (dateRange === '30d') startDate.setDate(now.getDate() - 30);
    else if (dateRange === '90d') startDate.setDate(now.getDate() - 90);
    else if (dateRange === '1y') startDate.setFullYear(now.getFullYear() - 1);
  }

  return { startDate, endDate };
};

export const getStudyHours = async (userId, filters = {}) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const matchFilter = { userId: new mongoose.Types.ObjectId(userId), date: { $gte: monthStart } };

  if (filters.subjectId && mongoose.Types.ObjectId.isValid(filters.subjectId)) {
    matchFilter.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
  }

  const [result] = await StudySession.aggregate([
    { $match: matchFilter },
    {
      $facet: {
        daily: [
          { $match: { date: { $gte: todayStart } } },
          { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
        ],
        weekly: [
          { $match: { date: { $gte: weekStart } } },
          { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
        ],
        monthly: [
          { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } },
        ],
      },
    },
  ]);

  const minutesToHours = (facetResult) => {
    const minutes = facetResult?.[0]?.totalMinutes || 0;
    return Math.round((minutes / 60) * 10) / 10;
  };

  return {
    todayHours: minutesToHours(result?.daily),
    dailyHours: minutesToHours(result?.daily),
    weeklyHours: minutesToHours(result?.weekly),
    monthlyHours: minutesToHours(result?.monthly),
    dailyMinutes: result?.daily?.[0]?.totalMinutes || 0,
    weeklyMinutes: result?.weekly?.[0]?.totalMinutes || 0,
    monthlyMinutes: result?.monthly?.[0]?.totalMinutes || 0,
  };
};

export const getDailyStudyHours = async (userId, days = 30, filters = {}) => {
  const { startDate, endDate } = parseDateFilter(filters.dateRange || `${days}d`, filters.startDate, filters.endDate);
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }

  if (filters.subjectId && mongoose.Types.ObjectId.isValid(filters.subjectId)) {
    matchStage.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
  }

  return StudySession.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalMinutes: { $sum: '$durationMinutes' },
        sessionCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        hours: { $round: [{ $divide: ['$totalMinutes', 60] }, 1] },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        totalMinutes: 1,
        hours: 1,
        sessionCount: 1,
        _id: 0,
      },
    },
  ]);
};

export const getConsistencyMetrics = async (userId, days = 30, filters = {}) => {
  const { startDate } = parseDateFilter(filters.dateRange || `${days}d`, filters.startDate, filters.endDate);
  const effectiveStartDate = startDate || new Date(Date.now() - days * 86400000);

  const activeDaysResult = await StudySession.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: effectiveStartDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const activeDays = activeDaysResult.length;
  const periodDays = Math.max(1, Math.ceil((Date.now() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const consistencyPercentage = Math.min(100, Math.round((activeDays / periodDays) * 100));

  const activeDateSet = new Set(activeDaysResult.map((d) => d._id));
  let tempStreak = 0;
  let currentStreak = 0;
  let longestStreak = 0;

  for (let i = 0; i < periodDays; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().slice(0, 10);

    if (activeDateSet.has(dateStr)) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (i === 0) {
        tempStreak = 0;
      } else {
        break;
      }
    }
  }
  currentStreak = tempStreak;

  tempStreak = 1;
  const sortedDays = activeDaysResult.map((d) => d._id).sort();
  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(sortedDays[i - 1]);
    const currDate = new Date(sortedDays[i]);
    const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return {
    activeDays,
    totalDays: periodDays,
    consistencyPercentage,
    currentStreak,
    currentStreakDays: currentStreak,
    longestStreak,
  };
};

export const getSyllabusCompletion = async (userId, examId) => {
  const examFilter = examId && mongoose.Types.ObjectId.isValid(examId)
    ? { examId: new mongoose.Types.ObjectId(examId) }
    : {};
  const progressFilter = examId && mongoose.Types.ObjectId.isValid(examId)
    ? { userId: new mongoose.Types.ObjectId(userId), examId: new mongoose.Types.ObjectId(examId) }
    : { userId: new mongoose.Types.ObjectId(userId) };

  const [totalTopics, progressRecords] = await Promise.all([
    Topic.countDocuments({ active: true, ...examFilter }),
    UserTopicProgress.find(progressFilter).lean(),
  ]);

  const completed = progressRecords.filter(
    (r) => r.status === 'Completed' || r.status === 'Revised'
  ).length;
  const inProgress = progressRecords.filter(
    (r) => r.status === 'In Progress'
  ).length;
  const notStarted = Math.max(0, totalTopics - completed - inProgress);
  const completionPercentage = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

  return {
    totalTopics,
    completed,
    inProgress,
    notStarted,
    completionPercentage,
    overallCompletionPercentage: completionPercentage,
  };
};

export const getSubjectPerformance = async (userId, filters = {}) => {
  const { startDate, endDate } = parseDateFilter(filters.dateRange, filters.startDate, filters.endDate);
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    selectedOptionIndex: { $gte: 0 },
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'pyqs',
        localField: 'pyqId',
        foreignField: '_id',
        as: 'pyq',
        pipeline: [{ $project: { subjectId: 1, examId: 1 } }],
      },
    },
    { $unwind: '$pyq' },
  ];

  if (filters.examId && mongoose.Types.ObjectId.isValid(filters.examId)) {
    pipeline.push({
      $match: { 'pyq.examId': new mongoose.Types.ObjectId(filters.examId) },
    });
  }

  if (filters.subjectId && mongoose.Types.ObjectId.isValid(filters.subjectId)) {
    pipeline.push({
      $match: { 'pyq.subjectId': new mongoose.Types.ObjectId(filters.subjectId) },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'subjects',
        localField: 'pyq.subjectId',
        foreignField: '_id',
        as: 'subject',
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$pyq.subjectId',
        subjectName: { $first: '$subject.name' },
        attempted: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        wrong: { $sum: { $cond: ['$isCorrect', 0, 1] } },
        avgTimeSec: { $avg: '$timeTakenSeconds' },
      },
    },
    {
      $addFields: {
        accuracy: {
          $cond: [
            { $gt: ['$attempted', 0] },
            {
              $round: [
                { $multiply: [{ $divide: ['$correct', '$attempted'] }, 100] },
                1,
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { subjectName: 1 } }
  );

  const subjects = await PYQAttempt.aggregate(pipeline);
  return { subjects };
};

export const getTopicPerformance = async (userId, subjectId, filters = {}) => {
  return getTopicAnalyticsWithWeaknessEngine(userId, { ...filters, subjectId });
};

export const getPYQAccuracy = async (userId, filters = {}) => {
  const { startDate, endDate } = parseDateFilter(filters.dateRange, filters.startDate, filters.endDate);
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    selectedOptionIndex: { $gte: 0 },
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const [result] = await PYQAttempt.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'pyqs',
        localField: 'pyqId',
        foreignField: '_id',
        as: 'pyq',
        pipeline: [{ $project: { difficulty: 1, subjectId: 1, examId: 1 } }],
      },
    },
    { $unwind: '$pyq' },
    ...(filters.examId && mongoose.Types.ObjectId.isValid(filters.examId)
      ? [{ $match: { 'pyq.examId': new mongoose.Types.ObjectId(filters.examId) } }]
      : []),
    ...(filters.subjectId && mongoose.Types.ObjectId.isValid(filters.subjectId)
      ? [{ $match: { 'pyq.subjectId': new mongoose.Types.ObjectId(filters.subjectId) } }]
      : []),
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
              wrong: { $sum: { $cond: ['$isCorrect', 0, 1] } },
            },
          },
        ],
        byDifficulty: [
          {
            $group: {
              _id: '$pyq.difficulty',
              total: { $sum: 1 },
              correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
              wrong: { $sum: { $cond: ['$isCorrect', 0, 1] } },
            },
          },
          {
            $addFields: {
              difficulty: '$_id',
              accuracy: {
                $cond: [
                  { $gt: ['$total', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$correct', '$total'] }, 100] },
                      1,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          { $project: { _id: 0 } },
          { $sort: { difficulty: 1 } },
        ],
      },
    },
  ]);

  const overall = result?.overall?.[0] || { total: 0, correct: 0, wrong: 0 };
  overall.totalAttempted = overall.total;
  overall.accuracy =
    overall.total > 0
      ? Math.round((overall.correct / overall.total) * 1000) / 10
      : 0;

  return {
    overall,
    accuracy: overall.accuracy,
    totalAttempted: overall.total,
    byDifficulty: result?.byDifficulty || [],
  };
};

export const getMockTestPerformance = async (userId, filters = {}) => {
  const { startDate, endDate } = parseDateFilter(filters.dateRange, filters.startDate, filters.endDate);
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }

  const [stats] = await MockTest.aggregate([
    { $match: matchStage },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalTests: { $sum: 1 },
              avgScore: { $avg: '$obtainedMarks' },
              avgPercentage: {
                $avg: {
                  $cond: [
                    { $gt: ['$totalMarks', 0] },
                    { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] },
                    0,
                  ],
                },
              },
              bestScore: { $max: '$obtainedMarks' },
              bestScorePercentage: {
                $max: {
                  $cond: [
                    { $gt: ['$totalMarks', 0] },
                    { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] },
                    0,
                  ],
                },
              },
              worstScore: { $min: '$obtainedMarks' },
              avgAccuracy: {
                $avg: {
                  $cond: [
                    { $gt: ['$questionsAttempted', 0] },
                    { $multiply: [{ $divide: ['$correct', '$questionsAttempted'] }, 100] },
                    0,
                  ],
                },
              },
              avgTimeTaken: { $avg: '$timeTaken' },
            },
          },
        ],
        recent: [
          { $sort: { date: -1 } },
          { $limit: 10 },
          {
            $project: {
              testName: 1,
              exam: 1,
              date: 1,
              totalMarks: 1,
              obtainedMarks: 1,
              correct: 1,
              wrong: 1,
              questionsAttempted: 1,
              timeTaken: 1,
              percentage: {
                $cond: [
                  { $gt: ['$totalMarks', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] },
                      1,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ],
      },
    },
  ]);

  const summary = stats?.summary?.[0] || {
    totalTests: 0,
    avgScore: 0,
    avgPercentage: 0,
    bestScore: 0,
    bestScorePercentage: 0,
    worstScore: 0,
    avgAccuracy: 0,
    avgTimeTaken: 0,
  };

  if (summary.avgScore) summary.avgScore = Math.round(summary.avgScore * 10) / 10;
  if (summary.avgPercentage) summary.avgPercentage = Math.round(summary.avgPercentage * 10) / 10;
  summary.avgScorePercentage = summary.avgPercentage;
  summary.totalCompleted = summary.totalTests;
  if (summary.bestScorePercentage) summary.bestScorePercentage = Math.round(summary.bestScorePercentage * 10) / 10;
  if (summary.avgAccuracy) summary.avgAccuracy = Math.round(summary.avgAccuracy * 10) / 10;
  if (summary.avgTimeTaken) summary.avgTimeTaken = Math.round(summary.avgTimeTaken);

  return {
    summary,
    totalCompleted: summary.totalTests,
    avgScorePercentage: summary.avgPercentage,
    bestScorePercentage: summary.bestScorePercentage,
    recentTests: stats?.recent || [],
  };
};

export const getScoreTrends = async (userId, days = 90, filters = {}) => {
  const { startDate, endDate } = parseDateFilter(filters.dateRange || `${days}d`, filters.startDate, filters.endDate);
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }

  return MockTest.aggregate([
    { $match: matchStage },
    { $sort: { date: 1 } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%U', date: '$date' } },
        avgScore: { $avg: '$obtainedMarks' },
        avgPercentage: {
          $avg: {
            $cond: [
              { $gt: ['$totalMarks', 0] },
              { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] },
              0,
            ],
          },
        },
        testCount: { $sum: 1 },
        firstDate: { $first: '$date' },
      },
    },
    {
      $addFields: {
        avgScore: { $round: ['$avgScore', 1] },
        avgPercentage: { $round: ['$avgPercentage', 1] },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        week: '$_id',
        avgScore: 1,
        avgPercentage: 1,
        testCount: 1,
        firstDate: 1,
        _id: 0,
      },
    },
  ]);
};

export const getAccuracyTrends = async (userId, days = 90, filters = {}) => {
  const { startDate, endDate } = parseDateFilter(filters.dateRange || `${days}d`, filters.startDate, filters.endDate);
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    selectedOptionIndex: { $gte: 0 },
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  return PYQAttempt.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%U', date: '$createdAt' } },
        total: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        firstDate: { $first: '$createdAt' },
      },
    },
    {
      $addFields: {
        accuracy: {
          $round: [
            { $multiply: [{ $divide: ['$correct', '$total'] }, 100] },
            1,
          ],
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        week: '$_id',
        total: 1,
        correct: 1,
        accuracy: 1,
        firstDate: 1,
        _id: 0,
      },
    },
  ]);
};

export const getStudyTypeDistribution = async (userId, days = 30, filters = {}) => {
  const { startDate, endDate } = parseDateFilter(filters.dateRange || `${days}d`, filters.startDate, filters.endDate);
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }

  return StudySession.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$studyType',
        totalMinutes: { $sum: '$durationMinutes' },
        sessionCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        studyType: '$_id',
        hours: { $round: [{ $divide: ['$totalMinutes', 60] }, 1] },
      },
    },
    { $project: { _id: 0 } },
    { $sort: { totalMinutes: -1 } },
  ]);
};

export const getTopicAnalyticsWithWeaknessEngine = async (userId, filters = {}) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const { startDate, endDate } = parseDateFilter(filters.dateRange, filters.startDate, filters.endDate);

  const topicQuery = { active: true };
  if (filters.examId && mongoose.Types.ObjectId.isValid(filters.examId)) {
    topicQuery.examId = new mongoose.Types.ObjectId(filters.examId);
  }
  if (filters.subjectId && mongoose.Types.ObjectId.isValid(filters.subjectId)) {
    topicQuery.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
  }

  const topics = await Topic.find(topicQuery)
    .populate('subjectId', 'name')
    .populate('examId', 'name')
    .lean();

  if (!topics.length) {
    return {
      summary: {
        totalTopics: 0,
        weakTopics: 0,
        moderateTopics: 0,
        strongTopics: 0,
        insufficientDataCount: 0,
      },
      topics: [],
    };
  }

  const topicIds = topics.map((t) => t._id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const pyqMatch = {
    userId: userObjId,
    selectedOptionIndex: { $gte: 0 },
  };
  if (startDate || endDate) {
    pyqMatch.createdAt = {};
    if (startDate) pyqMatch.createdAt.$gte = startDate;
    if (endDate) pyqMatch.createdAt.$lte = endDate;
  }

  const pyqAgg = await PYQAttempt.aggregate([
    { $match: pyqMatch },
    {
      $lookup: {
        from: 'pyqs',
        localField: 'pyqId',
        foreignField: '_id',
        as: 'pyq',
        pipeline: [{ $project: { topicId: 1 } }],
      },
    },
    { $unwind: '$pyq' },
    { $match: { 'pyq.topicId': { $in: topicIds } } },
    {
      $group: {
        _id: '$pyq.topicId',
        attempted: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        recentAttempted: {
          $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] },
        },
        recentCorrect: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', thirtyDaysAgo] },
                  { $eq: ['$isCorrect', true] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const pyqMap = new Map();
  pyqAgg.forEach((item) => {
    pyqMap.set(item._id.toString(), item);
  });

  const mockMatch = { userId: userObjId };
  if (startDate || endDate) {
    mockMatch.date = {};
    if (startDate) mockMatch.date.$gte = startDate;
    if (endDate) mockMatch.date.$lte = endDate;
  }

  const mockAgg = await MockTest.aggregate([
    { $match: mockMatch },
    { $unwind: '$topicPerformance' },
    {
      $group: {
        _id: '$topicPerformance.topic',
        totalScore: { $sum: '$topicPerformance.score' },
        count: { $sum: 1 },
      },
    },
  ]);

  const mockMap = new Map();
  mockAgg.forEach((item) => {
    mockMap.set(item._id.toLowerCase().trim(), item);
  });

  const [progressRecords, revisionRecords] = await Promise.all([
    UserTopicProgress.find({ userId: userObjId, topicId: { $in: topicIds } }).lean(),
    Revision.find({ userId: userObjId, topicId: { $in: topicIds } }).lean(),
  ]);

  const progressMap = new Map();
  progressRecords.forEach((p) => progressMap.set(p.topicId.toString(), p.status));

  const revisionMap = new Map();
  revisionRecords.forEach((r) => {
    const history = r.reviewHistory || [];
    const count = history.length;
    const lastRevisedAt = history.length > 0 ? history[history.length - 1].date : r.updatedAt;
    revisionMap.set(r.topicId.toString(), { count, lastRevisedAt });
  });

  const now = new Date();
  const processedTopics = topics.map((topic) => {
    const topicIdStr = topic._id.toString();
    const topicName = topic.name;

    const pyqData = pyqMap.get(topicIdStr) || { attempted: 0, correct: 0, recentAttempted: 0, recentCorrect: 0 };
    const pyqAttempted = pyqData.attempted;
    const pyqCorrect = pyqData.correct;
    const pyqAccuracy = pyqAttempted > 0 ? Math.round((pyqCorrect / pyqAttempted) * 1000) / 10 : 0;

    const mockData = mockMap.get(topicName.toLowerCase().trim()) || { count: 0, totalScore: 0 };
    const mockAttempted = mockData.count;
    const mockAccuracy = mockAttempted > 0 ? Math.min(100, Math.max(0, Math.round(mockData.totalScore / mockAttempted))) : 0;
    const mockCorrect = Math.round((mockAccuracy / 100) * mockAttempted);

    const totalAttempts = pyqAttempted + mockAttempted;

    let combinedAccuracy = 0;
    if (pyqAttempted > 0 && mockAttempted > 0) {
      combinedAccuracy = 0.5 * pyqAccuracy + 0.5 * mockAccuracy;
    } else if (pyqAttempted > 0) {
      combinedAccuracy = pyqAccuracy;
    } else if (mockAttempted > 0) {
      combinedAccuracy = mockAccuracy;
    }

    let recentAccuracy = combinedAccuracy;
    if (pyqData.recentAttempted > 0) {
      recentAccuracy = Math.round((pyqData.recentCorrect / pyqData.recentAttempted) * 1000) / 10;
    }

    const weightedAccuracy = pyqData.recentAttempted > 0
      ? 0.6 * recentAccuracy + 0.4 * combinedAccuracy
      : combinedAccuracy;

    const syllabusStatus = progressMap.get(topicIdStr) || 'Not Started';
    let syllabusMultiplier = 0.70;
    if (syllabusStatus === 'Revised') syllabusMultiplier = 1.05;
    else if (syllabusStatus === 'Completed') syllabusMultiplier = 1.00;
    else if (syllabusStatus === 'In Progress') syllabusMultiplier = 0.85;

    const revData = revisionMap.get(topicIdStr) || { count: 0, lastRevisedAt: null };
    let revisionPenalty = 0;
    let daysSinceRevision = null;

    if (revData.lastRevisedAt) {
      daysSinceRevision = Math.max(0, Math.floor((now.getTime() - new Date(revData.lastRevisedAt).getTime()) / (1000 * 60 * 60 * 24)));
      if (daysSinceRevision > 30 && (syllabusStatus === 'Completed' || syllabusStatus === 'Revised')) {
        revisionPenalty = -15;
      } else if (daysSinceRevision > 14) {
        revisionPenalty = -5;
      } else if (daysSinceRevision <= 7) {
        revisionPenalty = +5;
      }
    }

    let masteryScore = 0;
    if (totalAttempts === 0) {
      if (syllabusStatus === 'Revised' || syllabusStatus === 'Completed') masteryScore = 70;
      else if (syllabusStatus === 'In Progress') masteryScore = 40;
      else masteryScore = 20;
    } else {
      const rawScore = weightedAccuracy * syllabusMultiplier + revisionPenalty;
      masteryScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));
    }

    let classification = 'INSUFFICIENT_DATA';
    if (totalAttempts > 0) {
      if (masteryScore >= 75) classification = 'STRONG';
      else if (masteryScore >= 50) classification = 'MODERATE';
      else classification = 'WEAK';
    } else if (syllabusStatus === 'Revised' || syllabusStatus === 'Completed') {
      classification = 'MODERATE';
    } else {
      classification = 'NOT_ATTEMPTED';
    }

    let confidence = 'LOW';
    let insufficientData = true;

    if (totalAttempts >= 15) {
      confidence = 'HIGH';
      insufficientData = false;
    } else if (totalAttempts >= 5) {
      confidence = 'MEDIUM';
      insufficientData = false;
    } else {
      confidence = 'LOW';
      insufficientData = true;
    }

    let reason = '';
    if (totalAttempts === 0) {
      reason = `Topic status is "${syllabusStatus}" with 0 practice questions attempted. Attempt questions to establish baseline.`;
    } else if (insufficientData) {
      reason = `Limited sample size (${totalAttempts} attempt${totalAttempts === 1 ? '' : 's'}). Accuracy is ${combinedAccuracy.toFixed(1)}%. Attempt at least 5 questions for higher confidence.`;
    } else {
      reason = `Accuracy is ${combinedAccuracy.toFixed(1)}% across ${totalAttempts} attempt${totalAttempts === 1 ? '' : 's'}. Syllabus: ${syllabusStatus}. ${
        daysSinceRevision !== null ? `Last revised ${daysSinceRevision} day(s) ago.` : ''
      }`;
    }

    return {
      topicId: topic._id,
      topicName: topic.name,
      subjectId: topic.subjectId?._id || topic.subjectId,
      subjectName: topic.subjectId?.name || 'General',
      examId: topic.examId?._id || topic.examId,
      examName: topic.examId?.name || '',
      pyqAttempted,
      pyqCorrect,
      pyqAccuracy,
      mockAttempted,
      mockCorrect,
      mockAccuracy,
      recentAccuracy,
      totalAttempts,
      syllabusStatus,
      revisionCount: revData.count,
      lastRevisedAt: revData.lastRevisedAt,
      daysSinceRevision,
      masteryScore,
      classification,
      confidence,
      insufficientData,
      reason,

      attempted: totalAttempts,
      correct: pyqCorrect + mockCorrect,
      wrong: totalAttempts - (pyqCorrect + mockCorrect),
      accuracy: pyqAttempted > 0 ? pyqAccuracy : mockAccuracy,
    };
  });

  let filteredTopics = processedTopics;
  if (filters.classification && ['STRONG', 'MODERATE', 'WEAK'].includes(filters.classification.toUpperCase())) {
    filteredTopics = processedTopics.filter(
      (t) => t.classification === filters.classification.toUpperCase()
    );
  }

  const classificationPriority = { WEAK: 1, MODERATE: 2, STRONG: 3 };
  filteredTopics.sort((a, b) => {
    if (classificationPriority[a.classification] !== classificationPriority[b.classification]) {
      return classificationPriority[a.classification] - classificationPriority[b.classification];
    }
    return a.masteryScore - b.masteryScore;
  });

  const summary = {
    totalTopics: processedTopics.length,
    weakTopics: processedTopics.filter((t) => t.classification === 'WEAK').length,
    moderateTopics: processedTopics.filter((t) => t.classification === 'MODERATE').length,
    strongTopics: processedTopics.filter((t) => t.classification === 'STRONG').length,
    insufficientDataCount: processedTopics.filter((t) => t.insufficientData).length,
  };

  return {
    summary,
    topics: filteredTopics,
  };
};
