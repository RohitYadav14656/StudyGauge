import UserExam from '../models/UserExam.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import Exam from '../models/Exam.js';
import { calculateExamAnalytics } from '../services/progressService.js';

export const getUserExams = async (req, res, next) => {
  try {
    const userExams = await UserExam.find({ userId: req.user._id }).populate('examId');
    res.json(userExams);
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

    const savedExams = [];

    for (const examData of exams) {
      const { examId, targetDate, targetScore, targetRank } = examData;

      const examExists = await Exam.findById(examId);
      if (!examExists) continue;

      let userExam = await UserExam.findOne({ userId: req.user._id, examId });

      if (userExam) {

        if (targetDate !== undefined) userExam.targetDate = targetDate;
        if (targetScore !== undefined) userExam.targetScore = targetScore;
        if (targetRank !== undefined) userExam.targetRank = targetRank;
        
        await userExam.save();
      } else {

        userExam = await UserExam.create({
          userId: req.user._id,
          examId,
          targetDate,
          targetScore,
          targetRank,
          status: 'active'
        });
      }

      await userExam.populate('examId');
      savedExams.push(userExam);
    }

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
