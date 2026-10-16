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
import StudyPlan from '../src/models/StudyPlan.js';
import StudyPlanItem from '../src/models/StudyPlanItem.js';

describe('Adaptive Planning Engine API (Analysis & Adaptation)', () => {
  let userToken;
  let userId;
  let otherToken;
  let testExam;
  let testSubject;
  let topic1;
  let topic2;
  let topicDeclining;
  let topicOverdue;
  let studyPlan;

  const now = new Date('2026-09-21T00:00:00.000Z');

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
    await StudyPlan.deleteMany({});
    await StudyPlanItem.deleteMany({});

    const user = await User.create({
      name: 'Adaptive Student',
      email: 'adaptive_student@example.com',
      passwordHash: 'hashedpassword123',
    });
    userId = user._id;
    userToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret123', { expiresIn: '1h' });

    const otherUser = await User.create({
      name: 'Other Student',
      email: 'other_student@example.com',
      passwordHash: 'hashedpassword123',
    });
    otherToken = jwt.sign({ id: otherUser._id }, process.env.JWT_SECRET || 'testsecret123', { expiresIn: '1h' });

    testExam = await Exam.create({
      name: 'NEET UG',
      description: 'National Eligibility cum Entrance Test',
    });

    testSubject = await Subject.create({
      examId: testExam._id,
      name: 'Biology',
      weightage: 50,
    });

    topic1 = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Cell Biology',
    });

    topic2 = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Genetics',
    });

    topicDeclining = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Plant Physiology',
    });

    topicOverdue = await Topic.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      name: 'Human Physiology',
    });

    // Active User Exam target in 20 days
    await UserExam.create({
      userId,
      examId: testExam._id,
      targetDate: new Date(now.getTime() + 20 * 86400000),
      status: 'active',
    });

    // Create Study Plan
    studyPlan = await StudyPlan.create({
      userId,
      examId: testExam._id,
      title: 'Target 700 NEET Plan',
      startDate: new Date(now.getTime() - 5 * 86400000),
      endDate: new Date(now.getTime() + 15 * 86400000),
    });

    // 1. Past Completed Task
    await StudyPlanItem.create({
      studyPlanId: studyPlan._id,
      examId: testExam._id,
      topicId: topic1._id,
      subjectId: testSubject._id,
      title: 'Study Cell Organelles',
      date: new Date(now.getTime() - 4 * 86400000),
      plannedDuration: 60,
      actualDuration: 60,
      completion: 100,
      status: 'completed',
    });

    // 2. Past Missed Task
    await StudyPlanItem.create({
      studyPlanId: studyPlan._id,
      examId: testExam._id,
      topicId: topic2._id,
      subjectId: testSubject._id,
      title: 'Study Mendel Laws',
      date: new Date(now.getTime() - 2 * 86400000),
      plannedDuration: 90,
      actualDuration: 0,
      completion: 0,
      status: 'planned',
    });

    // 3. Partially Completed Task (Today / Past)
    await StudyPlanItem.create({
      studyPlanId: studyPlan._id,
      examId: testExam._id,
      topicId: topic1._id,
      subjectId: testSubject._id,
      title: 'Cell Division Mitosis',
      date: new Date(now.getTime() - 1 * 86400000),
      plannedDuration: 100,
      actualDuration: 40,
      completion: 40,
      status: 'partially_completed',
    });

    // 4. Repeatedly Postponed Task (rescheduleCount = 2)
    await StudyPlanItem.create({
      studyPlanId: studyPlan._id,
      examId: testExam._id,
      topicId: topic2._id,
      subjectId: testSubject._id,
      title: 'DNA Replication Mechanisms',
      date: new Date(now.getTime() + 1 * 86400000),
      plannedDuration: 60,
      actualDuration: 0,
      completion: 0,
      status: 'planned',
      rescheduleCount: 2,
    });

    // 5. Setup Overdue Revision
    await Revision.create({
      userId,
      topicId: topicOverdue._id,
      nextRevisionDate: new Date(now.getTime() - 3 * 86400000),
      status: 'OVERDUE',
    });

    // 6. Setup Declining Performance Topic (Low accuracy PYQ attempts)
    const pyqDeclining = await PYQ.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      topicId: topicDeclining._id,
      year: 2024,
      questionText: 'Photosynthesis dark reactions',
      options: [{ text: 'Calvin cycle', isCorrect: true }, { text: 'Krebs cycle', isCorrect: false }],
      difficulty: 'hard',
    });

    for (let i = 0; i < 8; i++) {
      await PYQAttempt.create({
        userId,
        pyqId: pyqDeclining._id,
        isCorrect: i < 1, // 12.5% accuracy
        selectedOptionIndex: i < 1 ? 0 : 1,
        timeTakenSeconds: 90,
        createdAt: new Date(now.getTime() - i * 86400000),
      });
    }

    await UserTopicProgress.create({
      userId,
      examId: testExam._id,
      topicId: topicDeclining._id,
      status: 'In Progress',
    });
  });

  test('GET /api/study-plans/:planId/adapt/analysis - detects missed, partial, overdue revision, declining performance, and postponed tasks', async () => {
    const res = await request(app)
      .get(`/api/study-plans/${studyPlan._id}/adapt/analysis?currentDate=${now.toISOString()}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.studyPlan.title).toBe('Target 700 NEET Plan');

    const { metrics, gapsDetected } = res.body;
    expect(metrics.completedTasksCount).toBe(1);
    expect(metrics.partiallyCompletedTasksCount).toBe(1);
    expect(metrics.missedTasksCount).toBe(1);
    expect(metrics.overdueRevisionsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.decliningPerformanceTopicsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.atRiskPostponedTasksCount).toBe(1);

    expect(gapsDetected.missedTasks[0].title).toBe('Study Mendel Laws');
    expect(gapsDetected.partiallyCompletedTasks[0].title).toBe('Cell Division Mitosis');
    expect(gapsDetected.atRiskPostponedTasks[0].title).toBe('DNA Replication Mechanisms');
    expect(gapsDetected.overdueRevisions.some((r) => r.topicName === 'Human Physiology')).toBe(true);
    expect(gapsDetected.decliningPerformanceTopics.some((d) => d.topicName === 'Plant Physiology')).toBe(true);
  });

  test('POST /api/study-plans/:planId/adapt - adapts future study plan and respects rules', async () => {
    const res = await request(app)
      .post(`/api/study-plans/${studyPlan._id}/adapt`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentDate: now.toISOString(),
        dailyStudyHours: 4, // 240 minutes daily limit
        protectRevisionRatio: 0.25,
        previewOnly: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.newItemsCreatedCount).toBeGreaterThan(0);

    // Verify day schedules do not exceed maxDailyMinutes (240 minutes)
    res.body.schedule.forEach((day) => {
      expect(day.totalPlannedMinutes).toBeLessThanOrEqual(240);
    });

    // Check DB items created for future dates
    const dbItems = await StudyPlanItem.find({
      studyPlanId: studyPlan._id,
      date: { $gte: now },
    }).sort({ date: 1 });

    expect(dbItems.length).toBeGreaterThan(0);

    // Rule 5 Verification: Repeatedly postponed task (rescheduleCount >= 2) must be in immediate next available day with high priority
    const postponedItem = dbItems.find((item) => item.title === 'DNA Replication Mechanisms');
    expect(postponedItem).toBeDefined();
    expect(postponedItem.priority).toBe('high');
    expect(postponedItem.adaptationReason).toContain('Locked into immediate next slot');

    // Rule 4 Verification: Overdue Spaced Revision task injected into schedule
    const revisionItem = dbItems.find((item) => item.activityType === 'revision');
    expect(revisionItem).toBeDefined();
    expect(revisionItem.isProtectedRevision).toBe(true);

    // Rule 3 Verification: All items scheduled within exam target date
    const targetExamDate = new Date(now.getTime() + 20 * 86400000);
    dbItems.forEach((item) => {
      expect(new Date(item.date).getTime()).toBeLessThanOrEqual(targetExamDate.getTime());
    });
  });

  test('POST /api/study-plans/:planId/adapt with previewOnly returns schedule without mutating DB', async () => {
    const initialItemsCount = await StudyPlanItem.countDocuments({ studyPlanId: studyPlan._id });

    const res = await request(app)
      .post(`/api/study-plans/${studyPlan._id}/adapt`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentDate: now.toISOString(),
        dailyStudyHours: 4,
        previewOnly: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.preview).toBe(true);
    expect(res.body.daySchedules).toBeDefined();

    const afterItemsCount = await StudyPlanItem.countDocuments({ studyPlanId: studyPlan._id });
    expect(afterItemsCount).toBe(initialItemsCount);
  });

  test('GET /api/study-plans/:planId/adapt/analysis for non-existent plan returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/study-plans/${fakeId}/adapt/analysis`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  test('POST /api/study-plans/:planId/adapt by unauthorized user returns 404', async () => {
    const res = await request(app)
      .post(`/api/study-plans/${studyPlan._id}/adapt`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ dailyStudyHours: 4 });

    expect(res.status).toBe(404);
  });

  test('GET /api/study-plans/:planId/adapt/analysis without auth returns 401', async () => {
    const res = await request(app).get(`/api/study-plans/${studyPlan._id}/adapt/analysis`);
    expect(res.status).toBe(401);
  });
});
