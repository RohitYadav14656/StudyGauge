import UserExam from '../models/UserExam.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import Exam from '../models/Exam.js';
import { calculateExamAnalytics } from '../services/progressService.js';

// @desc    Get all exams selected by the user
// @route   GET /api/users/exams
// @access  Private
export const getUserExams = async (req, res, next) => {
  try {
    const userExams = await UserExam.find({ userId: req.user._id }).populate('examId');
    res.json(userExams);
  } catch (error) {
    next(error);
  }
};

// @desc    Select multiple exams or update existing ones
// @route   POST /api/users/exams/batch
// @access  Private
export const selectExams = async (req, res, next) => {
  try {
    const { exams } = req.body; // Expects an array of objects: { examId, targetDate, targetScore, targetRank }

    if (!exams || !Array.isArray(exams)) {
      res.status(400);
      throw new Error('Please provide an array of exams');
    }

    const savedExams = [];

    for (const examData of exams) {
      const { examId, targetDate, targetScore, targetRank } = examData;

      // Check if exam exists
      const examExists = await Exam.findById(examId);
      if (!examExists) continue;

      let userExam = await UserExam.findOne({ userId: req.user._id, examId });

      if (userExam) {
        // Update existing
        if (targetDate !== undefined) userExam.targetDate = targetDate;
        if (targetScore !== undefined) userExam.targetScore = targetScore;
        if (targetRank !== undefined) userExam.targetRank = targetRank;
        
        await userExam.save();
      } else {
        // Create new
        userExam = await UserExam.create({
          userId: req.user._id,
          examId,
          targetDate,
          targetScore,
          targetRank,
          status: 'active'
        });
      }
      
      // Populate exam details for the response
      await userExam.populate('examId');
      savedExams.push(userExam);
    }

    res.status(201).json(savedExams);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's selected exam
// @route   PUT /api/users/exams/:id
// @access  Private
export const updateUserExam = async (req, res, next) => {
  try {
    const { targetDate, targetScore, targetRank, status } = req.body;

    const userExam = await UserExam.findById(req.params.id);

    if (!userExam) {
      res.status(404);
      throw new Error('UserExam not found');
    }

    // Ensure the userExam belongs to the current user
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

// @desc    Get user topic progress for an exam
// @route   GET /api/users/exams/:examId/progress
// @access  Private
export const getUserTopicProgress = async (req, res, next) => {
  try {
    const { examId } = req.params;
    
    // Fetch all progress records for this user and exam
    const progressRecords = await UserTopicProgress.find({
      userId: req.user._id,
      examId,
    }).lean();
    
    // Convert array to a map: { topicId: status }
    const progressMap = {};
    progressRecords.forEach(record => {
      progressMap[record.topicId.toString()] = record.status;
    });
    
    res.json(progressMap);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user topic progress
// @route   PUT /api/users/exams/:examId/topics/:topicId/progress
// @access  Private
export const updateUserTopicProgress = async (req, res, next) => {
  try {
    const { examId, topicId } = req.params;
    const { status } = req.body;
    
    if (!['Not Started', 'In Progress', 'Completed', 'Revised'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }
    
    // Ensure the exam is actually added to the user's list
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

// @desc    Get user exam progress analytics
// @route   GET /api/users/exams/:examId/progress/analytics
// @access  Private
export const getExamProgressAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;
    
    // Ensure the exam is actually added to the user's list
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
