import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/index.js';

import User from '../src/models/User.js';
import StudySession from '../src/models/StudySession.js';
import MockTest from '../src/models/MockTest.js';
import PYQAttempt from '../src/models/PYQAttempt.js';
import PYQ from '../src/models/PYQ.js';
import Revision from '../src/models/Revision.js';
import Topic from '../src/models/Topic.js';
import Subject from '../src/models/Subject.js';
import Exam from '../src/models/Exam.js';
import StudyPlan from '../src/models/StudyPlan.js';
import StudyPlanItem from '../src/models/StudyPlanItem.js';

/**
 * Unified Activity Timeline — Integration Tests
 *
 * Verifies:
 * - Pagination (page/limit)
 * - Date filtering (startDate/endDate)
 * - Activity type filtering
 * - Mixed-source merge ordering (newest first)
 * - Empty state handling
 * - Response schema
 */

let token;
let userId;
let examId;
let subjectId;
let topicId;

// ─── Setup ──────────────────────────────────────────────────

beforeAll(async () => {
  // Create a test user
  const user = await User.create({
    name: 'Timeline Test User',
    email: 'timeline@test.com',
    passwordHash: 'hashedpassword',
    role: 'student',
  });
  userId = user._id;
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create prerequisite documents
  const exam = await Exam.create({ name: 'JEE Main', category: 'Engineering' });
  examId = exam._id;

  const subject = await Subject.create({ name: 'Physics', examId });
  subjectId = subject._id;

  const topic = await Topic.create({ name: 'Kinematics', subjectId, examId });
  topicId = topic._id;
});

// ─── Helper: seed activities across sources ─────────────────

const seedActivities = async () => {
  const now = new Date();

  // Study sessions (days 1, 3, 5 ago)
  await StudySession.create([
    {
      userId,
      examId,
      subjectId,
      topicId,
      date: new Date(now.getTime() - 1 * 86400000),
      startTime: new Date(now.getTime() - 1 * 86400000),
      durationMinutes: 60,
      studyType: 'Lecture',
    },
    {
      userId,
      examId,
      subjectId,
      topicId,
      date: new Date(now.getTime() - 3 * 86400000),
      startTime: new Date(now.getTime() - 3 * 86400000),
      durationMinutes: 45,
      studyType: 'Practice',
    },
    {
      userId,
      examId,
      subjectId,
      topicId,
      date: new Date(now.getTime() - 5 * 86400000),
      startTime: new Date(now.getTime() - 5 * 86400000),
      durationMinutes: 30,
      studyType: 'Reading',
    },
  ]);

  // Mock tests (days 2, 4 ago)
  await MockTest.create([
    {
      userId,
      testName: 'JEE Mock 1',
      exam: 'JEE Main',
      date: new Date(now.getTime() - 2 * 86400000),
      totalMarks: 300,
      obtainedMarks: 210,
      questionsAttempted: 60,
      correct: 50,
      wrong: 10,
      timeTaken: 180,
    },
    {
      userId,
      testName: 'JEE Mock 2',
      exam: 'JEE Main',
      date: new Date(now.getTime() - 4 * 86400000),
      totalMarks: 300,
      obtainedMarks: 180,
      questionsAttempted: 55,
      correct: 40,
      wrong: 15,
      timeTaken: 170,
    },
  ]);

  // PYQ attempts (days 1, 6 ago)
  const pyq = await PYQ.create({
    examId,
    subjectId,
    topicId,
    year: 2023,
    questionText: 'A ball is thrown vertically upward with velocity 20 m/s. Find max height.',
    options: [
      { text: '20m', isCorrect: true },
      { text: '10m', isCorrect: false },
    ],
    difficulty: 'medium',
  });

  // Manually set createdAt via update to control ordering
  const pyqAttempt1 = await PYQAttempt.create({
    userId,
    pyqId: pyq._id,
    isCorrect: true,
    timeTakenSeconds: 45,
  });
  await PYQAttempt.updateOne(
    { _id: pyqAttempt1._id },
    { $set: { createdAt: new Date(now.getTime() - 1 * 86400000) } }
  );

  const pyqAttempt2 = await PYQAttempt.create({
    userId,
    pyqId: pyq._id,
    isCorrect: false,
    timeTakenSeconds: 120,
  });
  await PYQAttempt.updateOne(
    { _id: pyqAttempt2._id },
    { $set: { createdAt: new Date(now.getTime() - 6 * 86400000) } }
  );

  // Revision (day 2 ago)
  await Revision.create({
    userId,
    topicId,
    studiedDate: new Date(now.getTime() - 10 * 86400000),
    lastRevisedDate: new Date(now.getTime() - 2 * 86400000),
    revisionCount: 3,
    intervalStage: 2,
    nextRevisionDate: new Date(now.getTime() + 5 * 86400000),
    status: 'PENDING',
  });

  // Completed planner item (day 3 ago)
  const plan = await StudyPlan.create({
    userId,
    examId,
    title: 'Test Plan',
    startDate: new Date(now.getTime() - 30 * 86400000),
    status: 'active',
  });

  const planItem = await StudyPlanItem.create({
    studyPlanId: plan._id,
    examId,
    topicId,
    subjectId,
    title: 'Complete Kinematics revision',
    date: new Date(now.getTime() - 3 * 86400000),
    activityType: 'revision',
    status: 'completed',
    completion: 100,
    plannedDuration: 60,
    actualDuration: 55,
  });
  await StudyPlanItem.updateOne(
    { _id: planItem._id },
    { $set: { updatedAt: new Date(now.getTime() - 3 * 86400000) } }
  );
};

// ─── Tests ──────────────────────────────────────────────────

describe('GET /api/activity-timeline', () => {
  beforeEach(async () => {
    // Clear activity collections between tests
    await Promise.all([
      StudySession.deleteMany({}),
      MockTest.deleteMany({}),
      PYQAttempt.deleteMany({}),
      Revision.deleteMany({}),
      StudyPlanItem.deleteMany({}),
      StudyPlan.deleteMany({}),
      PYQ.deleteMany({}),
    ]);
  });

  test('returns empty timeline when no activities exist', async () => {
    const res = await request(app)
      .get('/api/activity-timeline')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      hasMore: false,
    });
    expect(res.body.availableTypes).toEqual(
      expect.arrayContaining(['study_session', 'mock_test', 'pyq_attempt', 'revision', 'planner_item'])
    );
  });

  test('returns activities from multiple sources sorted by date descending', async () => {
    await seedActivities();

    const res = await request(app)
      .get('/api/activity-timeline')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);

    // Verify descending date order
    const dates = res.body.data.map((a) => new Date(a.date).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }

    // Verify common schema
    for (const activity of res.body.data) {
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('type');
      expect(activity).toHaveProperty('title');
      expect(activity).toHaveProperty('description');
      expect(activity).toHaveProperty('date');
      expect(activity).toHaveProperty('metadata');
      expect(activity).toHaveProperty('sourceId');
    }
  });

  test('supports pagination with page and limit', async () => {
    await seedActivities();

    const res1 = await request(app)
      .get('/api/activity-timeline?page=1&limit=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res1.body.data.length).toBe(3);
    expect(res1.body.pagination.page).toBe(1);
    expect(res1.body.pagination.limit).toBe(3);
    expect(res1.body.pagination.hasMore).toBe(true);

    const res2 = await request(app)
      .get('/api/activity-timeline?page=2&limit=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res2.body.data.length).toBeGreaterThan(0);
    expect(res2.body.pagination.page).toBe(2);

    // No overlap between pages
    const page1Ids = new Set(res1.body.data.map((a) => a.id));
    for (const a of res2.body.data) {
      expect(page1Ids.has(a.id)).toBe(false);
    }
  });

  test('filters by activity type', async () => {
    await seedActivities();

    const res = await request(app)
      .get('/api/activity-timeline?types=study_session')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(3); // 3 study sessions seeded
    for (const activity of res.body.data) {
      expect(activity.type).toBe('study_session');
    }
  });

  test('filters by multiple activity types', async () => {
    await seedActivities();

    const res = await request(app)
      .get('/api/activity-timeline?types=study_session,mock_test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(5); // 3 sessions + 2 mock tests
    for (const activity of res.body.data) {
      expect(['study_session', 'mock_test']).toContain(activity.type);
    }
  });

  test('filters by date range', async () => {
    await seedActivities();

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 1 * 86400000).toISOString();

    const res = await request(app)
      .get(`/api/activity-timeline?startDate=${threeDaysAgo}&endDate=${oneDayAgo}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // All returned activities should be within the date range
    for (const activity of res.body.data) {
      const actDate = new Date(activity.date).getTime();
      expect(actDate).toBeGreaterThanOrEqual(new Date(threeDaysAgo).getTime());
      expect(actDate).toBeLessThanOrEqual(new Date(oneDayAgo).getTime());
    }
  });

  test('validates invalid activity type', async () => {
    const res = await request(app)
      .get('/api/activity-timeline?types=invalid_type')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res.body.message || res.body.error || JSON.stringify(res.body)).toMatch(/[Vv]alidation|[Ii]nvalid/);
  });

  test('clamps limit to max 50', async () => {
    const res = await request(app)
      .get('/api/activity-timeline?limit=100')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    // Joi validation should reject limit > 50
    expect(res.body.message || JSON.stringify(res.body)).toMatch(/[Vv]alidation|limit/i);
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .get('/api/activity-timeline')
      .expect(401);
  });

  test('normalizes mock test with correct metadata', async () => {
    await seedActivities();

    const res = await request(app)
      .get('/api/activity-timeline?types=mock_test')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    const mockActivity = res.body.data[0];
    expect(mockActivity.metadata).toHaveProperty('totalMarks');
    expect(mockActivity.metadata).toHaveProperty('obtainedMarks');
    expect(mockActivity.metadata).toHaveProperty('scorePercentage');
    expect(mockActivity.metadata).toHaveProperty('exam');
  });

  test('normalizes PYQ attempt with correct metadata', async () => {
    await seedActivities();

    const res = await request(app)
      .get('/api/activity-timeline?types=pyq_attempt')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    const pyqActivity = res.body.data[0];
    expect(pyqActivity.metadata).toHaveProperty('isCorrect');
    expect(typeof pyqActivity.metadata.isCorrect).toBe('boolean');
  });
});
