import UserExam from '../models/UserExam.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import Exam from '../models/Exam.js';
import { calculateExamAnalytics } from '../services/progressService.js';
import { clearDashboardCache } from '../services/dashboardService.js';

export const getUserExams = async (req, res, next) => {
  try {
    const userExams = await UserExam.find({ userId: req.user._id, status: { $ne: 'inactive' } })
      .populate('examId')
      .sort({ updatedAt: -1 });

    const validExams = userExams.filter(ue => ue.examId && ue.examId._id);
    res.json(validExams);
  } catch (error) {
    next(error);
  }
};

export const activateExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const userId = req.user._id;

    const examExists = await Exam.findById(examId);
    if (!examExists) {
      res.status(404);
      throw new Error('Exam not found');
    }

    let userExam = await UserExam.findOne({ userId, examId });
    if (!userExam) {
      userExam = await UserExam.create({
        userId,
        examId,
        status: 'active',
      });
    } else {
      userExam.status = 'active';
      userExam.updatedAt = new Date();
      await userExam.save();
    }

    clearDashboardCache(userId);

    await userExam.populate('examId');
    res.json({ success: true, activeExam: userExam });
  } catch (error) {
    next(error);
  }
};

export const selectExams = async (req, res, next) => {
  try {
    const { exams } = req.body;

    if (!exams || !Array.isArray(exams)) {
      res.status(400);
      throw new Error('Please provide an array of exams');
    }

    const userId = req.user._id;
    const submittedExamIds = [];
    const savedExams = [];

    for (const examData of exams) {
      const { examId, targetDate, targetScore, targetRank } = examData;
      if (!examId) continue;

      const examExists = await Exam.findById(examId);
      if (!examExists) continue;

      submittedExamIds.push(examId.toString());

      let userExam = await UserExam.findOne({ userId, examId });

      const parsedDate = targetDate && typeof targetDate === 'string' && targetDate.trim() !== ''
        ? new Date(targetDate)
        : undefined;

      if (userExam) {
        if (targetDate !== undefined) userExam.targetDate = parsedDate;
        if (targetScore !== undefined) userExam.targetScore = targetScore;
        if (targetRank !== undefined) userExam.targetRank = targetRank ? Number(targetRank) : undefined;
        userExam.status = 'active';
        userExam.updatedAt = new Date();
        await userExam.save();
      } else {
        userExam = await UserExam.create({
          userId,
          examId,
          targetDate: parsedDate,
          targetScore,
          targetRank: targetRank ? Number(targetRank) : undefined,
          status: 'active'
        });
      }

      await userExam.populate('examId');
      savedExams.push(userExam);
    }

    // Inactivate exams not in the newly submitted list
    if (submittedExamIds.length > 0) {
      await UserExam.updateMany(
        { userId, examId: { $nin: submittedExamIds } },
        { status: 'inactive' }
      );
    } else {
      await UserExam.updateMany({ userId }, { status: 'inactive' });
    }

    clearDashboardCache(userId);

    res.status(201).json(savedExams);
  } catch (error) {
    next(error);
  }
};

export const updateUserExam = async (req, res, next) => {
  try {
    const { targetDate, targetScore, targetRank, status } = req.body;

    const userExam = await UserExam.findById(req.params.id);

    if (!userExam) {
      res.status(404);
      throw new Error('UserExam not found');
    }

    if (userExam.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this record');
    }

    if (targetDate !== undefined) userExam.targetDate = targetDate;
    if (targetScore !== undefined) userExam.targetScore = targetScore;
    if (targetRank !== undefined) userExam.targetRank = targetRank;
    if (status !== undefined) userExam.status = status;

    const updatedUserExam = await userExam.save();
    clearDashboardCache(req.user._id);
    await updatedUserExam.populate('examId');

    res.json(updatedUserExam);
  } catch (error) {
    next(error);
  }
};

export const getUserTopicProgress = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const progressRecords = await UserTopicProgress.find({
      userId: req.user._id,
      examId,
    }).lean();

    const progressMap = {};
    progressRecords.forEach(record => {
      progressMap[record.topicId.toString()] = record.status;
    });
    
    res.json(progressMap);
  } catch (error) {
    next(error);
  }
};

export const updateUserTopicProgress = async (req, res, next) => {
  try {
    const { examId, topicId } = req.params;
    const { status } = req.body;
    
    if (!['Not Started', 'In Progress', 'Completed', 'Revised'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }

    const userExam = await UserExam.findOne({ userId: req.user._id, examId });
    if (!userExam) {
      res.status(403);
      throw new Error('You must add this exam to your list before tracking progress');
    }
    
    const progress = await UserTopicProgress.findOneAndUpdate(
      { userId: req.user._id, examId, topicId },
      { status },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json(progress);
  } catch (error) {
    next(error);
  }
};

export const getExamProgressAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const userExam = await UserExam.findOne({ userId: req.user._id, examId });
    if (!userExam) {
      res.status(403);
      throw new Error('You must add this exam to your list before tracking progress');
    }

    const analytics = await calculateExamAnalytics(req.user._id, examId);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};
