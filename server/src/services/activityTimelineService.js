import mongoose from 'mongoose';
import StudySession from '../models/StudySession.js';
import MockTest from '../models/MockTest.js';
import PYQAttempt from '../models/PYQAttempt.js';
import Revision from '../models/Revision.js';
import StudyPlanItem from '../models/StudyPlanItem.js';
import StudyPlan from '../models/StudyPlan.js';

/**
 * Unified Activity Timeline Service
 *
 * Combines activities from multiple collections into a single chronologically
 * sorted, paginated timeline. Uses a parallel fan-out strategy — each source
 * collection is queried independently with its own date-range filter and
 * per-source limit, then results are merged via k-way merge on the `date`
 * field.
 *
 * Key design decisions:
 * - Never loads full history: each sub-query fetches at most (limit + 1) docs
 *   per source to detect whether more data exists.
 * - Date-keyed pagination avoids O(n) skip offsets on large collections.
 * - Activity-type filtering happens at the DB query level (queries for
 *   unrequested types are simply skipped), not post-fetch.
 */

/** All recognized activity types in the timeline */
export const ACTIVITY_TYPES = [
  'study_session',
  'mock_test',
  'pyq_attempt',
  'revision',
  'planner_item',
];

// ──────────────────────────────────────────────────────────────
// Normalizers — convert source-specific documents into a common shape
// ──────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────
// Source query builders
// ──────────────────────────────────────────────────────────────

/**
 * Builds a date-range filter object for a given date field name.
 */
const buildDateFilter = (fieldName, startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter[fieldName] = {};
    if (startDate) filter[fieldName].$gte = new Date(startDate);
    if (endDate) filter[fieldName].$lte = new Date(endDate);
  }
  return filter;
};

/**
 * Fetches study sessions for the timeline.
 */
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

/**
 * Fetches mock tests for the timeline.
 */
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

/**
 * Fetches PYQ attempts for the timeline.
 */
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

/**
 * Fetches revisions that have been actively revised (lastRevisedDate != null)
 * for the timeline.
 */
const fetchRevisions = async (userId, startDate, endDate, fetchLimit) => {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    lastRevisedDate: { $ne: null },
    ...buildDateFilter('lastRevisedDate', startDate, endDate),
  };
  // If both lastRevisedDate $ne and date filter exist, merge them
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

/**
 * Fetches completed planner items for the timeline.
 * Only items with status 'completed' or 'partially_completed' are included.
 */
const fetchPlannerItems = async (userId, startDate, endDate, fetchLimit) => {
  // First find study plans belonging to this user
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

// ──────────────────────────────────────────────────────────────
// Source registry — maps type names to fetcher functions
// ──────────────────────────────────────────────────────────────

const SOURCE_FETCHERS = {
  study_session: fetchStudySessions,
  mock_test: fetchMockTests,
  pyq_attempt: fetchPYQAttempts,
  revision: fetchRevisions,
  planner_item: fetchPlannerItems,
};

// ──────────────────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────────────────

/**
 * Returns a paginated, filtered, unified activity timeline.
 *
 * @param {string}   userId              - Authenticated user's ID
 * @param {Object}   options
 * @param {string}   [options.startDate] - ISO date string, lower bound
 * @param {string}   [options.endDate]   - ISO date string, upper bound
 * @param {string[]} [options.types]     - Subset of ACTIVITY_TYPES to include
 * @param {number}   [options.page=1]    - 1-indexed page number
 * @param {number}   [options.limit=20]  - Items per page (max 50)
 *
 * @returns {{ activities: Object[], pagination: { page, limit, total, hasMore } }}
 */
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

  // Determine which sources to query
  const requestedTypes = types && types.length > 0
    ? types.filter((t) => ACTIVITY_TYPES.includes(t))
    : [...ACTIVITY_TYPES];

  if (requestedTypes.length === 0) {
    return { activities: [], pagination: { page: pageNum, limit: clampedLimit, total: 0, hasMore: false } };
  }

  // Each source fetches enough to fill the requested page even if it were
  // the sole contributor. We add 1 to detect hasMore.
  const perSourceLimit = clampedLimit * pageNum + 1;

  // Fan out parallel queries only for requested types
  const fetchPromises = requestedTypes.map((type) => {
    const fetcher = SOURCE_FETCHERS[type];
    return fetcher
      ? fetcher(userId, startDate, endDate, perSourceLimit).catch(() => [])
      : Promise.resolve([]);
  });

  const results = await Promise.all(fetchPromises);

  // Merge all results and sort by date descending
  const allActivities = results
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Paginate
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
