import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import MockTest from '../models/MockTest.js';
import PYQAttempt from '../models/PYQAttempt.js';
import Revision from '../models/Revision.js';
import StudyPlanItem from '../models/StudyPlanItem.js';
import StudyPlan from '../models/StudyPlan.js';

export const ACTIVITY_TYPES = [
  'study_session',
  'mock_test',
  'pyq_attempt',
  'revision',
  'planner_item',
];

const normalizeStudySession = (doc) => ({
  id: doc._id.toString(),
  type: 'study_session',
  title: `${doc.studyType} Session`,
  description: doc.notes || `${doc.studyType} study session`,
  date: doc.date || doc.startTime,
  durationMinutes: doc.durationMinutes || null,
  metadata: {
    studyType: doc.studyType,
    subjectName: doc.subjectId?.name || null,
    topicName: doc.topicId?.name || null,
    examId: doc.examId?.toString() || null,
  },
  sourceId: doc._id.toString(),
});

const normalizeMockTest = (doc) => ({
  id: doc._id.toString(),
  type: 'mock_test',
  title: doc.testName,
  description: `Scored ${doc.obtainedMarks}/${doc.totalMarks} (${Math.round((doc.obtainedMarks / doc.totalMarks) * 100)}%)`,
  date: doc.date,
  durationMinutes: doc.timeTaken || null,
  metadata: {
    exam: doc.exam,
    totalMarks: doc.totalMarks,
    obtainedMarks: doc.obtainedMarks,
    correct: doc.correct,
    wrong: doc.wrong,
    questionsAttempted: doc.questionsAttempted,
    scorePercentage: Math.round((doc.obtainedMarks / doc.totalMarks) * 100),
  },
  sourceId: doc._id.toString(),
});

const normalizePYQAttempt = (doc) => ({
  id: doc._id.toString(),
  type: 'pyq_attempt',
  title: `PYQ Attempt — ${doc.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}`,
  description: doc.pyqId?.questionText
    ? doc.pyqId.questionText.substring(0, 120) + (doc.pyqId.questionText.length > 120 ? '…' : '')
    : 'Previous year question attempt',
  date: doc.createdAt,
  durationMinutes: doc.timeTakenSeconds ? Math.round(doc.timeTakenSeconds / 60) : null,
  metadata: {
    isCorrect: doc.isCorrect,
    timeTakenSeconds: doc.timeTakenSeconds || null,
    bookmarked: doc.bookmarked,
    markedForRevision: doc.markedForRevision,
    pyqYear: doc.pyqId?.year || null,
    difficulty: doc.pyqId?.difficulty || null,
    topicName: doc.pyqId?.topicId?.name || null,
    subjectName: doc.pyqId?.subjectId?.name || null,
  },
  sourceId: doc._id.toString(),
});

const normalizeRevision = (doc) => ({
  id: doc._id.toString(),
  type: 'revision',
  title: `Revision — ${doc.topicId?.name || 'Topic'}`,
  description: `Stage ${doc.intervalStage}, revision #${doc.revisionCount}`,
  date: doc.lastRevisedDate || doc.studiedDate,
  durationMinutes: null,
  metadata: {
    topicName: doc.topicId?.name || null,
    revisionCount: doc.revisionCount,
    intervalStage: doc.intervalStage,
    status: doc.status,
    nextRevisionDate: doc.nextRevisionDate,
    easeFactor: doc.easeFactor,
  },
  sourceId: doc._id.toString(),
});

const normalizePlannerItem = (doc) => ({
  id: doc._id.toString(),
  type: 'planner_item',
  title: doc.title || doc.topicId?.name || 'Completed Task',
  description: `${doc.activityType} — ${doc.status} (${doc.completion}%)`,
  date: doc.updatedAt || doc.date,
  durationMinutes: doc.actualDuration || doc.plannedDuration || null,
  metadata: {
    activityType: doc.activityType,
    priority: doc.priority,
    status: doc.status,
    completion: doc.completion,
    topicName: doc.topicId?.name || null,
    subjectName: doc.subjectId?.name || null,
    plannedDuration: doc.plannedDuration,
    actualDuration: doc.actualDuration,
  },
  sourceId: doc._id.toString(),
});

const buildDateFilter = (fieldName, startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter[fieldName] = {};
    if (startDate) filter[fieldName].$gte = new Date(startDate);
    if (endDate) filter[fieldName].$lte = new Date(endDate);
  }
  return filter;
};

const fetchStudySessions = async (userId, startDate, endDate, fetchLimit) => {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    ...buildDateFilter('date', startDate, endDate),
  };
  const docs = await StudySession.find(query)
    .sort({ date: -1 })
    .limit(fetchLimit)
    .populate('subjectId', 'name')
    .populate('topicId', 'name')
    .lean();
  return docs.map(normalizeStudySession);
};

const fetchMockTests = async (userId, startDate, endDate, fetchLimit) => {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    ...buildDateFilter('date', startDate, endDate),
  };
  const docs = await MockTest.find(query)
    .sort({ date: -1 })
    .limit(fetchLimit)
    .lean();
  return docs.map(normalizeMockTest);
};

const fetchPYQAttempts = async (userId, startDate, endDate, fetchLimit) => {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    ...buildDateFilter('createdAt', startDate, endDate),
  };
  const docs = await PYQAttempt.find(query)
    .sort({ createdAt: -1 })
    .limit(fetchLimit)
    .populate({
      path: 'pyqId',
      select: 'questionText year difficulty topicId subjectId',
      populate: [
        { path: 'topicId', select: 'name' },
        { path: 'subjectId', select: 'name' },
      ],
    })
    .lean();
  return docs.map(normalizePYQAttempt);
};

const fetchRevisions = async (userId, startDate, endDate, fetchLimit) => {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    lastRevisedDate: { $ne: null },
    ...buildDateFilter('lastRevisedDate', startDate, endDate),
  };

  if (startDate || endDate) {
    const dateFilter = buildDateFilter('lastRevisedDate', startDate, endDate);
    query.lastRevisedDate = { ...query.lastRevisedDate, ...dateFilter.lastRevisedDate };
  }

  const docs = await Revision.find(query)
    .sort({ lastRevisedDate: -1 })
    .limit(fetchLimit)
    .populate('topicId', 'name')
    .lean();
  return docs.map(normalizeRevision);
};

const fetchPlannerItems = async (userId, startDate, endDate, fetchLimit) => {

  const studyPlans = await StudyPlan.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .select('_id')
    .lean();

  if (studyPlans.length === 0) return [];

  const studyPlanIds = studyPlans.map((sp) => sp._id);

  const query = {
    studyPlanId: { $in: studyPlanIds },
    status: { $in: ['completed', 'partially_completed'] },
    ...buildDateFilter('updatedAt', startDate, endDate),
  };

  const docs = await StudyPlanItem.find(query)
    .sort({ updatedAt: -1 })
    .limit(fetchLimit)
    .populate('topicId', 'name')
    .populate('subjectId', 'name')
    .lean();
  return docs.map(normalizePlannerItem);
};

const SOURCE_FETCHERS = {
  study_session: fetchStudySessions,
  mock_test: fetchMockTests,
  pyq_attempt: fetchPYQAttempts,
  revision: fetchRevisions,
  planner_item: fetchPlannerItems,
};

export const getActivityTimeline = async (userId, options = {}) => {
  const {
    startDate,
    endDate,
    types,
    page = 1,
    limit = 20,
  } = options;

  const clampedLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const pageNum = Math.max(1, Number(page) || 1);

  const requestedTypes = types && types.length > 0
    ? types.filter((t) => ACTIVITY_TYPES.includes(t))
    : [...ACTIVITY_TYPES];

  if (requestedTypes.length === 0) {
    return { activities: [], pagination: { page: pageNum, limit: clampedLimit, total: 0, hasMore: false } };
  }

  const perSourceLimit = clampedLimit * pageNum + 1;

  const fetchPromises = requestedTypes.map((type) => {
    const fetcher = SOURCE_FETCHERS[type];
    return fetcher
      ? fetcher(userId, startDate, endDate, perSourceLimit).catch(() => [])
      : Promise.resolve([]);
  });

  const results = await Promise.all(fetchPromises);

  const allActivities = results
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const startIdx = (pageNum - 1) * clampedLimit;
  const pageItems = allActivities.slice(startIdx, startIdx + clampedLimit);
  const hasMore = allActivities.length > startIdx + clampedLimit;

  return {
    activities: pageItems,
    pagination: {
      page: pageNum,
      limit: clampedLimit,
      total: allActivities.length,
      hasMore,
    },
  };
};
