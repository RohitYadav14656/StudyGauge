import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/index.js';
import User from '../src/models/User.js';
import Exam from '../src/models/Exam.js';
import Subject from '../src/models/Subject.js';
import Topic from '../src/models/Topic.js';
import PYQ from '../src/models/PYQ.js';
import PYQAttempt from '../src/models/PYQAttempt.js';
import UserTopicProgress from '../src/models/UserTopicProgress.js';
import Revision from '../src/models/Revision.js';
import UserExam from '../src/models/UserExam.js';
import StudySession from '../src/models/StudySession.js';

describe('Deterministic Topic Recommendation Engine API (GET /api/recommendations)', () => {
  let userToken;
  let userId;
  let testExam;
  let testSubject;
  let topicWeak;
  let topicOverdue;
  let topicStrong;

  beforeEach(async () => {
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    await PYQ.deleteMany({});
    await PYQAttempt.deleteMany({});
    await UserTopicProgress.deleteMany({});
    await Revision.deleteMany({});
    await UserExam.deleteMany({});
    await StudySession.deleteMany({});

    const user = await User.create({
      name: 'Recommendation Student',
      email: 'rec_student@example.com',
      passwordHash: 'hashedpassword123',
    });
    userId = user._id;
    userToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret123', { expiresIn: '1h' });

    testExam = await Exam.create({
      name: 'JEE Main',
      description: 'Joint Entrance Examination Main',
    });

    testSubject = await Subject.create({
      examId: testExam._id,
      name: 'Physics',
      weightage: 35,
    });

    topicWeak = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Electromagnetism',
    });

    topicOverdue = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Optics',
    });

    topicStrong = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Kinematics',
    });

    // 1. User Target Exam setup (Exam in 10 days)
    await UserExam.create({
      userId,
      examId: testExam._id,
      targetDate: new Date(Date.now() + 10 * 86400000),
      status: 'active',
    });

    // 2. Setup Topic Weak (Low accuracy 20%, In Progress)
    const weakPyq = await PYQ.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      topicId: topicWeak._id,
      year: 2023,
      questionText: 'Magnetic flux unit',
      options: [{ text: 'Weber', isCorrect: true }, { text: 'Tesla', isCorrect: false }],
      difficulty: 'hard',
    });

    for (let i = 0; i < 10; i++) {
      await PYQAttempt.create({
        userId,
        pyqId: weakPyq._id,
        isCorrect: i < 2,
        selectedOptionIndex: i < 2 ? 0 : 1,
        timeTakenSeconds: 60,
        createdAt: new Date(Date.now() - i * 86400000),
      });
    }

    await UserTopicProgress.create({
      userId,
      examId: testExam._id,
      topicId: topicWeak._id,
      status: 'In Progress',
    });

    // 3. Setup Topic Overdue (Overdue revision by 8 days)
    await UserTopicProgress.create({
      userId,
      examId: testExam._id,
      topicId: topicOverdue._id,
      status: 'Completed',
    });

    await Revision.create({
      userId,
      topicId: topicOverdue._id,
      nextRevisionDate: new Date(Date.now() - 8 * 86400000),
      status: 'OVERDUE',
    });

    // 4. Setup Topic Strong (High accuracy 90%, Revised)
    const strongPyq = await PYQ.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      topicId: topicStrong._id,
      year: 2022,
      questionText: 'Velocity vector equation',
      options: [{ text: 'v = u + at', isCorrect: true }, { text: 'v = u', isCorrect: false }],
      difficulty: 'easy',
    });

    for (let i = 0; i < 15; i++) {
      await PYQAttempt.create({
        userId,
        pyqId: strongPyq._id,
        isCorrect: i < 14,
        selectedOptionIndex: 0,
        timeTakenSeconds: 30,
        createdAt: new Date(Date.now() - i * 86400000),
      });
    }

    await UserTopicProgress.create({
      userId,
      examId: testExam._id,
      topicId: topicStrong._id,
      status: 'Revised',
    });

    await StudySession.create({
      userId,
      subjectId: testSubject._id,
      topicId: topicStrong._id,
      durationMinutes: 45,
      studyType: 'Reading',
      date: new Date(Date.now() - 2 * 86400000),
    });
  });

  test('GET /api/recommendations - returns prioritized topic recommendations with required fields', async () => {
    const res = await request(app)
      .get('/api/recommendations')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { meta, recommendations } = res.body.data;
    expect(meta).toBeDefined();
    expect(meta.totalRecommendations).toBeGreaterThanOrEqual(1);

    const firstRec = recommendations[0];
    expect(firstRec).toHaveProperty('topic');
    expect(firstRec).toHaveProperty('priority');
    expect(firstRec).toHaveProperty('recommendedAction');
    expect(firstRec).toHaveProperty('reasonCodes');
    expect(firstRec).toHaveProperty('reasons');
    expect(firstRec).toHaveProperty('supportingMetrics');

    expect(firstRec.topic.name).toBeDefined();
    expect(firstRec.priority.score).toBeGreaterThan(0);
    expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(firstRec.priority.level);
    expect(Array.isArray(firstRec.reasonCodes)).toBe(true);
    expect(Array.isArray(firstRec.reasons)).toBe(true);
  });

  test('GET /api/recommendations - detects weak topic and assigns high priority with explainable reason codes', async () => {
    const res = await request(app)
      .get('/api/recommendations')
      .set('Authorization', `Bearer ${userToken}`);

    const weakRec = res.body.data.recommendations.find((r) => r.topic.name === 'Electromagnetism');
    expect(weakRec).toBeDefined();
    expect(weakRec.reasonCodes).toContain('WEAK_TOPIC_ACCURACY_LOW');
    expect(weakRec.reasonCodes).toContain('EXAM_APPROACHING');
    expect(weakRec.recommendedAction.actionType).toBe('PRACTICE_PYQS');
    expect(weakRec.supportingMetrics.accuracy).toBe(20);
  });

  test('GET /api/recommendations - identifies overdue revision topic', async () => {
    const res = await request(app)
      .get('/api/recommendations')
      .set('Authorization', `Bearer ${userToken}`);

    const overdueRec = res.body.data.recommendations.find((r) => r.topic.name === 'Optics');
    expect(overdueRec).toBeDefined();
    expect(overdueRec.reasonCodes).toContain('REVISION_OVERDUE');
    expect(overdueRec.recommendedAction.actionType).toBe('REVISE_CONCEPTS');
    expect(overdueRec.supportingMetrics.daysOverdue).toBe(8);
  });

  test('GET /api/recommendations?availableTime=30 - respects available time filter', async () => {
    const res = await request(app)
      .get('/api/recommendations?availableTime=30')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.meta.availableTimeMinutes).toBe(30);
    res.body.data.recommendations.forEach((r) => {
      expect(r.recommendedAction.estimatedMinutes).toBeLessThanOrEqual(30);
    });
  });

  test('GET /api/recommendations without auth token returns 401', async () => {
    const res = await request(app).get('/api/recommendations');
    expect(res.status).toBe(401);
  });
});
