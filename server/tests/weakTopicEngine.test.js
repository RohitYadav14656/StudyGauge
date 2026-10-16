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
import MockTest from '../src/models/MockTest.js';
import UserTopicProgress from '../src/models/UserTopicProgress.js';
import Revision from '../src/models/Revision.js';

describe('Deterministic Weak-Topic Detection Engine & Analytics API', () => {
  let userToken;
  let userId;
  let testExam;
  let testSubject;
  let topicStrong;
  let topicModerate;
  let topicWeak;
  let topicInsufficient;

  beforeEach(async () => {
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    await PYQ.deleteMany({});
    await PYQAttempt.deleteMany({});
    await MockTest.deleteMany({});
    await UserTopicProgress.deleteMany({});
    await Revision.deleteMany({});

    const user = await User.create({
      name: 'Test Student',
      email: 'student@example.com',
      passwordHash: 'hashedpassword123',
    });
    userId = user._id;
    userToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret123', { expiresIn: '1h' });

    testExam = await Exam.create({
      name: 'JEE Advanced',
      description: 'Joint Entrance Examination',
    });

    testSubject = await Subject.create({
      examId: testExam._id,
      name: 'Physics',
    });

    topicStrong = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Thermodynamics',
    });

    topicModerate = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Rotational Dynamics',
    });

    topicWeak = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Quantum Optics',
    });

    topicInsufficient = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Fluid Mechanics',
    });

    // 1. Strong Topic (>15 attempts, 90% accuracy, revised recently)
    const strongPyq = await PYQ.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      topicId: topicStrong._id,
      year: 2023,
      questionText: 'What is the first law of thermodynamics?',
      options: [
        { text: 'dQ = dU + dW', isCorrect: true },
        { text: 'F = ma', isCorrect: false },
      ],
      difficulty: 'medium',
    });

    for (let i = 0; i < 20; i++) {
      await PYQAttempt.create({
        userId,
        pyqId: strongPyq._id,
        isCorrect: i < 18,
        selectedOptionIndex: i < 18 ? 0 : 1,
        timeTakenSeconds: 45,
        createdAt: new Date(Date.now() - (i % 5) * 86400000),
      });
    }

    await UserTopicProgress.create({
      userId,
      examId: testExam._id,
      topicId: topicStrong._id,
      status: 'Revised',
    });

    await Revision.create({
      userId,
      topicId: topicStrong._id,
      nextRevisionDate: new Date(Date.now() + 7 * 86400000),
      nextReviewDate: new Date(Date.now() + 7 * 86400000),
      reviewHistory: [
        { date: new Date(Date.now() - 2 * 86400000), quality: 5 },
      ],
    });

    // 2. Moderate Topic (10 attempts, 60% accuracy, completed)
    const moderatePyq = await PYQ.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      topicId: topicModerate._id,
      year: 2022,
      questionText: 'Calculate moment of inertia',
      options: [
        { text: 'MR^2', isCorrect: false },
        { text: '1/2 MR^2', isCorrect: true },
      ],
      difficulty: 'medium',
    });

    for (let i = 0; i < 10; i++) {
      await PYQAttempt.create({
        userId,
        pyqId: moderatePyq._id,
        isCorrect: i < 6,
        selectedOptionIndex: i < 6 ? 1 : 0,
        timeTakenSeconds: 60,
        createdAt: new Date(Date.now() - i * 86400000),
      });
    }

    await UserTopicProgress.create({
      userId,
      examId: testExam._id,
      topicId: topicModerate._id,
      status: 'Completed',
    });

    // 3. Weak Topic (10 attempts, 20% accuracy, overdue revision)
    const weakPyq = await PYQ.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      topicId: topicWeak._id,
      year: 2021,
      questionText: 'Photoelectric work function formula',
      options: [
        { text: 'hf', isCorrect: false },
        { text: 'hf - K_max', isCorrect: true },
      ],
      difficulty: 'hard',
    });

    for (let i = 0; i < 10; i++) {
      await PYQAttempt.create({
        userId,
        pyqId: weakPyq._id,
        isCorrect: i < 2,
        selectedOptionIndex: i < 2 ? 1 : 0,
        timeTakenSeconds: 90,
        createdAt: new Date(Date.now() - (i + 10) * 86400000),
      });
    }

    await UserTopicProgress.create({
      userId,
      examId: testExam._id,
      topicId: topicWeak._id,
      status: 'In Progress',
    });

    await Revision.create({
      userId,
      topicId: topicWeak._id,
      nextRevisionDate: new Date(Date.now() - 35 * 86400000),
      nextReviewDate: new Date(Date.now() - 35 * 86400000),
      reviewHistory: [
        { date: new Date(Date.now() - 40 * 86400000), quality: 1 },
      ],
    });

    // 4. Insufficient Data Topic (2 attempts)
    const insufficientPyq = await PYQ.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      topicId: topicInsufficient._id,
      year: 2023,
      questionText: 'Bernoulli equation terms',
      options: [
        { text: 'P + 1/2 rho v^2', isCorrect: true },
        { text: 'F = P A', isCorrect: false },
      ],
      difficulty: 'easy',
    });

    for (let i = 0; i < 2; i++) {
      await PYQAttempt.create({
        userId,
        pyqId: insufficientPyq._id,
        isCorrect: true,
        selectedOptionIndex: 0,
        timeTakenSeconds: 30,
        createdAt: new Date(),
      });
    }
  });

  test('GET /api/analytics/topics - evaluates deterministic classifications correctly', async () => {
    const res = await request(app)
      .get('/api/analytics/topics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { summary, topics } = res.body.data;

    expect(summary.totalTopics).toBe(4);
    expect(summary.weakTopics).toBeGreaterThanOrEqual(1);
    expect(summary.strongTopics).toBeGreaterThanOrEqual(1);
    expect(summary.insufficientDataCount).toBe(1);

    const strongItem = topics.find((t) => t.topicName === 'Thermodynamics');
    expect(strongItem).toBeDefined();
    expect(strongItem.classification).toBe('STRONG');
    expect(strongItem.confidence).toBe('HIGH');
    expect(strongItem.insufficientData).toBe(false);
    expect(strongItem.pyqAccuracy).toBe(90);

    const weakItem = topics.find((t) => t.topicName === 'Quantum Optics');
    expect(weakItem).toBeDefined();
    expect(weakItem.classification).toBe('WEAK');

    const insufficientItem = topics.find((t) => t.topicName === 'Fluid Mechanics');
    expect(insufficientItem).toBeDefined();
    expect(insufficientItem.insufficientData).toBe(true);
    expect(insufficientItem.confidence).toBe('LOW');
  });

  test('GET /api/analytics/topics?classification=WEAK - filters only weak topics', async () => {
    const res = await request(app)
      .get('/api/analytics/topics?classification=WEAK')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.topics.every((t) => t.classification === 'WEAK')).toBe(true);
  });

  test('GET /api/analytics/overview - returns aggregated dashboard overview with filters', async () => {
    const res = await request(app)
      .get('/api/analytics/overview?dateRange=30d')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pyqAccuracy).toBeDefined();
    expect(res.body.data.weakTopicsSummary).toBeDefined();
  });

  test('Edge Case: 0 attempts topic is handled safely with insufficient data', async () => {
    await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Magnetism',
    });

    const res = await request(app)
      .get('/api/analytics/topics')
      .set('Authorization', `Bearer ${userToken}`);

    const item = res.body.data.topics.find((t) => t.topicName === 'Magnetism');
    expect(item).toBeDefined();
    expect(item.totalAttempts).toBe(0);
    expect(item.insufficientData).toBe(true);
    expect(item.confidence).toBe('LOW');
    expect(item.reason).toContain('0 practice questions attempted');
  });

  test('Unauthorized access returns 401', async () => {
    const res = await request(app).get('/api/analytics/topics');
    expect(res.status).toBe(401);
  });
});
