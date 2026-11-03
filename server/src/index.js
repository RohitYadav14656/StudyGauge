import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import userExamRoutes from './routes/userExamRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import topicRoutes from './routes/topicRoutes.js';
import studySessionRoutes from './routes/studySessionRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import studyPlanRoutes from './routes/studyPlanRoutes.js';
import mockTestRoutes from './routes/mockTestRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import pyqRoutes from './routes/pyqRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import revisionRoutes from './routes/revisionRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import activityTimelineRoutes from './routes/activityTimelineRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import ragRoutes from './routes/ragRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users/exams', userExamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/pyqs', pyqRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-timeline', activityTimelineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/users', userRoutes);

app.get('/api/status', (req, res) => {
  res.json({ message: 'StudyGauge Backend is running', status: 'OK' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
