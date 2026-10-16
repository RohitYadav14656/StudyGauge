import mongoose from 'mongoose';
import { getTopicRecommendations } from '../services/recommendationService.js';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import PYQ from '../models/PYQ.js';
import PYQAttempt from '../models/PYQAttempt.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import Revision from '../models/Revision.js';
import UserExam from '../models/UserExam.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studygauge_test';

async function runTest() {
  console.log('Connecting to MongoDB for recommendation engine verification...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Cleanup test data
    await User.deleteMany({ email: 'test_rec_standalone@example.com' });

    const user = await User.create({
      name: 'Test Standalone User',
      email: 'test_rec_standalone@example.com',
      passwordHash: 'hash123',
    });

    const exam = await Exam.create({
      name: 'JEE Advanced Test Exam',
      description: 'Test Exam',
    });

    const subject = await Subject.create({
      examId: exam._id,
      name: 'Physics',
      weightage: 35,
    });

    const topic1 = await Topic.create({
      examId: exam._id,
      subjectId: subject._id,
      name: 'Thermodynamics Test Topic',
    });

    await UserExam.create({
      userId: user._id,
      examId: exam._id,
      targetDate: new Date(Date.now() + 15 * 86400000),
      status: 'active',
    });

    const pyq = await PYQ.create({
      examId: exam._id,
      subjectId: subject._id,
      topicId: topic1._id,
      year: 2024,
      questionText: 'Test question',
      options: [{ text: 'A', isCorrect: true }],
    });

    // Create 10 attempts (20% accuracy)
    for (let i = 0; i < 10; i++) {
      await PYQAttempt.create({
        userId: user._id,
        pyqId: pyq._id,
        isCorrect: i < 2,
        selectedOptionIndex: 0,
        timeTakenSeconds: 45,
      });
    }

    await UserTopicProgress.create({
      userId: user._id,
      examId: exam._id,
      topicId: topic1._id,
      status: 'In Progress',
    });

    await Revision.create({
      userId: user._id,
      topicId: topic1._id,
      nextRevisionDate: new Date(Date.now() - 5 * 86400000),
      status: 'OVERDUE',
    });

    console.log('Calling getTopicRecommendations...');
    const result = await getTopicRecommendations(user._id.toString(), { availableTime: 45 });

    console.log('--- RECOMMENDATION RESULT ---');
    console.log(JSON.stringify(result, null, 2));

    // Assertions
    if (!result.recommendations || result.recommendations.length === 0) {
      throw new Error('FAILED: Expected recommendations, got empty array.');
    }

    const rec = result.recommendations[0];
    if (rec.priority.score < 50) {
      throw new Error(`FAILED: Expected priority score >= 50, got ${rec.priority.score}`);
    }

    if (!rec.reasonCodes.includes('WEAK_TOPIC_ACCURACY_LOW') || !rec.reasonCodes.includes('REVISION_OVERDUE')) {
      throw new Error('FAILED: Missing expected reason codes in recommendation output.');
    }

    console.log('✅ ALL RECOMMENDATION ENGINE VERIFICATION CHECKS PASSED SUCCESSFULLY!');

    // Cleanup
    await User.deleteMany({ _id: user._id });
    await Exam.deleteMany({ _id: exam._id });
    await Subject.deleteMany({ _id: subject._id });
    await Topic.deleteMany({ _id: topic1._id });
    await PYQ.deleteMany({ _id: pyq._id });
    await PYQAttempt.deleteMany({ userId: user._id });
    await UserTopicProgress.deleteMany({ userId: user._id });
    await Revision.deleteMany({ userId: user._id });
    await UserExam.deleteMany({ userId: user._id });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTest();
