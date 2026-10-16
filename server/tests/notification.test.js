import request from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import Notification from '../src/models/Notification.js';
import Revision from '../src/models/Revision.js';
import Topic from '../src/models/Topic.js';
import Subject from '../src/models/Subject.js';
import Exam from '../src/models/Exam.js';
import UserExam from '../src/models/UserExam.js';
import Goal from '../src/models/Goal.js';
import Recommendation from '../src/models/Recommendation.js';
import StudyPlan from '../src/models/StudyPlan.js';
import StudyPlanItem from '../src/models/StudyPlanItem.js';

describe('In-App Notification API & Engine', () => {
  let token;
  let user;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Notification Tester',
      email: 'notif@example.com',
      password: 'Password123!',
    });

    token = regRes.body.token;
    user = await User.findOne({ email: 'notif@example.com' });
  });

  describe('GET /api/notifications', () => {
    it('should return empty array when no notifications exist', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toEqual([]);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('should fetch user notifications and respect pagination', async () => {
      await Notification.create([
        { userId: user._id, title: 'Notif 1', message: 'Msg 1', type: 'system' },
        { userId: user._id, title: 'Notif 2', message: 'Msg 2', type: 'system' },
        { userId: user._id, title: 'Notif 3', message: 'Msg 3', type: 'system' },
      ]);

      const res = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.notifications.length).toBe(2);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.totalPages).toBe(2);
    });

    it('should filter notifications by isRead and type', async () => {
      await Notification.create([
        { userId: user._id, title: 'Read Goal', message: 'M', type: 'goal_progress', isRead: true },
        { userId: user._id, title: 'Unread Goal', message: 'M', type: 'goal_progress', isRead: false },
        { userId: user._id, title: 'Unread Exam', message: 'M', type: 'upcoming_exam', isRead: false },
      ]);

      const resRead = await request(app)
        .get('/api/notifications?isRead=true')
        .set('Authorization', `Bearer ${token}`);

      expect(resRead.body.data.notifications.length).toBe(1);
      expect(resRead.body.data.notifications[0].title).toBe('Read Goal');

      const resGoal = await request(app)
        .get('/api/notifications?type=upcoming_exam')
        .set('Authorization', `Bearer ${token}`);

      expect(resGoal.body.data.notifications.length).toBe(1);
      expect(resGoal.body.data.notifications[0].type).toBe('upcoming_exam');
    });
  });

  describe('Deduplication Prevention', () => {
    it('should prevent creating duplicate notifications with identical dedupKey', async () => {
      const payload = {
        title: 'Revision Warning',
        message: 'Physics revision is due',
        type: 'revision_due',
        dedupKey: `revision_due:${user._id}:topic123:2026-09-24`,
      };

      const firstRes = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(firstRes.statusCode).toBe(201);
      expect(firstRes.body.data.created).toBe(true);

      const duplicateRes = await request(app)
        .post('/api/notifications/test')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(duplicateRes.statusCode).toBe(201);
      expect(duplicateRes.body.data.created).toBe(false);

      const count = await Notification.countDocuments({ userId: user._id });
      expect(count).toBe(1);
    });
  });

  describe('Read / Unread State Operations', () => {
    it('should mark a single notification as read', async () => {
      const notif = await Notification.create({
        userId: user._id,
        title: 'Unread Notif',
        message: 'Details',
        type: 'recommendation',
        isRead: false,
      });

      const res = await request(app)
        .patch(`/api/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).toBeDefined();
    });

    it('should mark all user notifications as read', async () => {
      await Notification.create([
        { userId: user._id, title: 'N1', message: 'M', type: 'system', isRead: false },
        { userId: user._id, title: 'N2', message: 'M', type: 'system', isRead: false },
      ]);

      const res = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.modifiedCount).toBe(2);

      const unreadRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);

      expect(unreadRes.body.data.unreadCount).toBe(0);
    });
  });

  describe('Auto Notification Generator for 6 Required Types', () => {
    it('should generate revision_due notification', async () => {
      const exam = await Exam.create({ name: 'Physics Exam', code: 'PHY_EX' });
      const subject = await Subject.create({ name: 'Physics', code: 'PHY101', examId: exam._id });
      const topic = await Topic.create({ name: 'Kinematics', subjectId: subject._id, examId: exam._id });
      await Revision.create({
        userId: user._id,
        topicId: topic._id,
        nextRevisionDate: new Date(Date.now() - 86400000), // Yesterday
        status: 'PENDING',
      });

      const res = await request(app)
        .post('/api/notifications/generate')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      const revNotif = res.body.data.notifications.find((n) => n.type === 'revision_due');
      expect(revNotif).toBeDefined();
      expect(revNotif.title).toContain('Kinematics');
    });

    it('should generate missed_study_plan notification', async () => {
      const exam = await Exam.create({ name: 'JEE Advanced', code: 'JEE' });
      const plan = await StudyPlan.create({
        userId: user._id,
        examId: exam._id,
        title: 'JEE Study Plan',
        startDate: new Date(Date.now() - 7 * 86400000),
        endDate: new Date(Date.now() + 7 * 86400000),
      });

      await StudyPlanItem.create({
        studyPlanId: plan._id,
        examId: exam._id,
        title: 'Solve Optics Problems',
        date: new Date(Date.now() - 86400000), // Yesterday
        status: 'planned',
      });

      const res = await request(app)
        .post('/api/notifications/generate')
        .set('Authorization', `Bearer ${token}`);

      const missedNotif = res.body.data.notifications.find((n) => n.type === 'missed_study_plan');
      expect(missedNotif).toBeDefined();
      expect(missedNotif.message).toContain('Solve Optics Problems');
    });

    it('should generate upcoming_exam notification', async () => {
      const exam = await Exam.create({ name: 'NEET 2026', code: 'NEET', examDate: new Date(Date.now() + 5 * 86400000) });
      await UserExam.create({
        userId: user._id,
        examId: exam._id,
        targetDate: new Date(Date.now() + 5 * 86400000), // 5 days from now
        status: 'active',
      });

      const res = await request(app)
        .post('/api/notifications/generate')
        .set('Authorization', `Bearer ${token}`);

      const examNotif = res.body.data.notifications.find((n) => n.type === 'upcoming_exam');
      expect(examNotif).toBeDefined();
      expect(examNotif.title).toContain('NEET 2026');
    });

    it('should generate recommendation notification', async () => {
      await Recommendation.create({
        userId: user._id,
        title: 'Focus on Organic Chemistry',
        description: 'Your score in Organic Chemistry is lower than average.',
        type: 'topic-review',
        status: 'pending',
      });

      const res = await request(app)
        .post('/api/notifications/generate')
        .set('Authorization', `Bearer ${token}`);

      const recNotif = res.body.data.notifications.find((n) => n.type === 'recommendation');
      expect(recNotif).toBeDefined();
      expect(recNotif.title).toContain('Focus on Organic Chemistry');
    });

    it('should generate planner_changes notification', async () => {
      const exam = await Exam.create({ name: 'GATE CS', code: 'GATE' });
      const plan = await StudyPlan.create({
        userId: user._id,
        examId: exam._id,
        title: 'GATE Study Plan',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 86400000),
      });

      await StudyPlanItem.create({
        studyPlanId: plan._id,
        examId: exam._id,
        title: 'Algorithms Revision',
        date: new Date(),
        rescheduleCount: 1,
        adaptationReason: 'Rebalanced after missed test',
      });

      const res = await request(app)
        .post('/api/notifications/generate')
        .set('Authorization', `Bearer ${token}`);

      const plannerNotif = res.body.data.notifications.find((n) => n.type === 'planner_changes');
      expect(plannerNotif).toBeDefined();
      expect(plannerNotif.message).toContain('Algorithms Revision');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      const notif = await Notification.create({
        userId: user._id,
        title: 'Delete Me',
        message: 'Bye',
        type: 'system',
      });

      const deleteRes = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toBe(200);

      const findNotif = await Notification.findById(notif._id);
      expect(findNotif).toBeNull();
    });
  });
});
