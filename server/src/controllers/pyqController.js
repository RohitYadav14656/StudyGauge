import mongoose from 'mongoose';
import PYQ from '../models/PYQ.js';
import PYQAttempt from '../models/PYQAttempt.js';

/**
 * Strips answer data (isCorrect, explanation) from PYQ documents
 * so that users cannot see answers before submitting in quiz mode.
 */
const stripAnswerData = (pyq) => {
  const cleaned = { ...pyq };
  // Remove explanation entirely
  delete cleaned.explanation;
  // Remove isCorrect from each option
  if (cleaned.options) {
    cleaned.options = cleaned.options.map(({ text, _id }) => ({ text, _id }));
  }
  return cleaned;
};

// @desc    Get PYQs with filtering, search, and pagination (answer data stripped)
// @route   GET /api/pyqs
// @access  Private
export const getPYQs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      examId,
      subjectId,
      topicId,
      year,
      difficulty,
      tags,
      search
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const query = {};

    if (examId) query.examId = new mongoose.Types.ObjectId(examId);
    if (subjectId) query.subjectId = new mongoose.Types.ObjectId(subjectId);
    if (topicId) query.topicId = new mongoose.Types.ObjectId(topicId);
    if (year) query.year = Number(year);
    if (difficulty) query.difficulty = difficulty;

    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tagsArray.length > 0) {
        query.tags = { $in: tagsArray };
      }
    }

    // Full-text search using MongoDB text index
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Use aggregation to also embed each user's attempt status in one query
    const userId = req.user._id;

    const pipeline = [
      { $match: query },
      { $sort: { year: -1, createdAt: -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
      // Populate exam name
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: '_exam',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      // Populate subject name
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: '_subject',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      // Populate topic name
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: '_topic',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      // Lookup user's attempt for this PYQ
      {
        $lookup: {
          from: 'pyqattempts',
          let: { pyqId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$pyqId', '$$pyqId'] },
                    { $eq: ['$userId', userId] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                isCorrect: 1,
                selectedOptionIndex: 1,
                timeTakenSeconds: 1,
                bookmarked: 1,
                markedForRevision: 1,
                createdAt: 1,
              },
            },
          ],
          as: '_attempt',
        },
      },
      {
        $addFields: {
          examId: { $arrayElemAt: ['$_exam', 0] },
          subjectId: { $arrayElemAt: ['$_subject', 0] },
          topicId: { $arrayElemAt: ['$_topic', 0] },
          userAttempt: { $arrayElemAt: ['$_attempt', 0] },
        },
      },
      {
        $project: {
          _exam: 0,
          _subject: 0,
          _topic: 0,
          _attempt: 0,
          // Strip answer data: remove explanation and isCorrect from options
          explanation: 0,
        },
      },
    ];

    const [pyqs, countResult] = await Promise.all([
      PYQ.aggregate(pipeline),
      PYQ.countDocuments(query),
    ]);

    // Strip isCorrect from options in the result
    const sanitized = pyqs.map(stripAnswerData);

    res.json({
      success: true,
      data: sanitized,
      pagination: {
        total: countResult,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(countResult / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single PYQ by ID (answer data stripped, includes attempt status)
// @route   GET /api/pyqs/:id
// @access  Private
export const getPYQ = async (req, res, next) => {
  try {
    const pyq = await PYQ.findById(req.params.id)
      .populate('examId', 'name')
      .populate('subjectId', 'name')
      .populate('topicId', 'name')
      .lean();

    if (!pyq) {
      res.status(404);
      throw new Error('PYQ not found');
    }

    // Check if user has already attempted this PYQ
    const attempt = await PYQAttempt.findOne({
      userId: req.user._id,
      pyqId: req.params.id,
    })
      .sort({ createdAt: -1 })
      .select('isCorrect selectedOptionIndex timeTakenSeconds bookmarked markedForRevision createdAt')
      .lean();

    const sanitized = stripAnswerData(pyq);
    sanitized.userAttempt = attempt || null;

    res.json({ success: true, data: sanitized });
  } catch (error) {
    next(error);
  }
};

// @desc    Attempt a PYQ (submit answer)
// @route   POST /api/pyqs/:id/attempt
// @access  Private
export const attemptPYQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { selectedOptionIndex, timeTakenSeconds } = req.body;

    const pyq = await PYQ.findById(id);

    if (!pyq) {
      res.status(404);
      throw new Error('PYQ not found');
    }

    if (
      selectedOptionIndex === undefined ||
      selectedOptionIndex < 0 ||
      selectedOptionIndex >= pyq.options.length
    ) {
      res.status(400);
      throw new Error('Invalid option selected');
    }

    const isCorrect = pyq.options[selectedOptionIndex].isCorrect;

    // Check if user already attempted — allow re-attempt but track the latest
    const existingAttempt = await PYQAttempt.findOne({
      userId: req.user._id,
      pyqId: id,
    });

    let attempt;
    if (existingAttempt) {
      // Update existing attempt
      existingAttempt.isCorrect = isCorrect;
      existingAttempt.selectedOptionIndex = selectedOptionIndex;
      existingAttempt.timeTakenSeconds = timeTakenSeconds || 0;
      attempt = await existingAttempt.save();
    } else {
      attempt = await PYQAttempt.create({
        userId: req.user._id,
        pyqId: id,
        isCorrect,
        timeTakenSeconds: timeTakenSeconds || 0,
        selectedOptionIndex,
      });
    }

    // Only reveal answer data AFTER submission
    res.status(existingAttempt ? 200 : 201).json({
      success: true,
      data: attempt,
      explanation: pyq.explanation || null,
      correctOptionIndex: pyq.options.findIndex((opt) => opt.isCorrect),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's PYQ statistics
// @route   GET /api/pyqs/stats
// @access  Private
export const getPYQStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Single aggregation pipeline for overall + per-subject + per-topic stats
    const [overallStats] = await PYQAttempt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalAttempted: { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          wrong: { $sum: { $cond: ['$isCorrect', 0, 1] } },
          totalBookmarked: { $sum: { $cond: ['$bookmarked', 1, 0] } },
          totalRevision: { $sum: { $cond: ['$markedForRevision', 1, 0] } },
          avgTimeTaken: { $avg: '$timeTakenSeconds' },
        },
      },
    ]);

    // Per-subject stats using $lookup to get subject from PYQ
    const subjectStats = await PYQAttempt.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'pyqs',
          localField: 'pyqId',
          foreignField: '_id',
          as: 'pyq',
          pipeline: [{ $project: { subjectId: 1 } }],
        },
      },
      { $unwind: '$pyq' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'pyq.subjectId',
          foreignField: '_id',
          as: 'subject',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$pyq.subjectId',
          subjectName: { $first: '$subject.name' },
          attempted: { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          wrong: { $sum: { $cond: ['$isCorrect', 0, 1] } },
        },
      },
      {
        $addFields: {
          accuracy: {
            $cond: [
              { $gt: ['$attempted', 0] },
              { $round: [{ $multiply: [{ $divide: ['$correct', '$attempted'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { subjectName: 1 } },
    ]);

    const stats = overallStats || {
      totalAttempted: 0,
      correct: 0,
      wrong: 0,
      totalBookmarked: 0,
      totalRevision: 0,
      avgTimeTaken: 0,
    };

    stats.accuracy =
      stats.totalAttempted > 0
        ? Math.round((stats.correct / stats.totalAttempted) * 1000) / 10
        : 0;

    res.json({
      success: true,
      data: {
        overall: stats,
        bySubject: subjectStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark on a PYQ
// @route   PATCH /api/pyqs/:id/bookmark
// @access  Private
export const toggleBookmark = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const pyqId = req.params.id;

    // Verify PYQ exists
    const pyqExists = await PYQ.exists({ _id: pyqId });
    if (!pyqExists) {
      res.status(404);
      throw new Error('PYQ not found');
    }

    // Find or create attempt record to store bookmark
    let attempt = await PYQAttempt.findOne({ userId, pyqId });

    if (attempt) {
      attempt.bookmarked = !attempt.bookmarked;
      await attempt.save();
    } else {
      // Create a placeholder attempt record for bookmarking without answering.
      // isCorrect is false, selectedOptionIndex is -1 (unanswered marker).
      attempt = await PYQAttempt.create({
        userId,
        pyqId,
        isCorrect: false,
        selectedOptionIndex: -1,
        bookmarked: true,
        timeTakenSeconds: 0,
      });
    }

    res.json({
      success: true,
      bookmarked: attempt.bookmarked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle mark-for-revision on a PYQ
// @route   PATCH /api/pyqs/:id/revision
// @access  Private
export const toggleRevision = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const pyqId = req.params.id;

    const pyqExists = await PYQ.exists({ _id: pyqId });
    if (!pyqExists) {
      res.status(404);
      throw new Error('PYQ not found');
    }

    let attempt = await PYQAttempt.findOne({ userId, pyqId });

    if (attempt) {
      attempt.markedForRevision = !attempt.markedForRevision;
      await attempt.save();
    } else {
      attempt = await PYQAttempt.create({
        userId,
        pyqId,
        isCorrect: false,
        selectedOptionIndex: -1,
        markedForRevision: true,
        timeTakenSeconds: 0,
      });
    }

    res.json({
      success: true,
      markedForRevision: attempt.markedForRevision,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bookmarked PYQs
// @route   GET /api/pyqs/bookmarks
// @access  Private
export const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    // Aggregation: get bookmarked attempts, then join PYQ data
    const pipeline = [
      { $match: { userId, bookmarked: true } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'pyqs',
          localField: 'pyqId',
          foreignField: '_id',
          as: 'pyq',
        },
      },
      { $unwind: '$pyq' },
      {
        $lookup: {
          from: 'exams',
          localField: 'pyq.examId',
          foreignField: '_id',
          as: 'pyq._exam',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'pyq.subjectId',
          foreignField: '_id',
          as: 'pyq._subject',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $addFields: {
          'pyq.examId': { $arrayElemAt: ['$pyq._exam', 0] },
          'pyq.subjectId': { $arrayElemAt: ['$pyq._subject', 0] },
        },
      },
      {
        $project: {
          'pyq._exam': 0,
          'pyq._subject': 0,
          'pyq.explanation': 0,
        },
      },
    ];

    const [results, countResult] = await Promise.all([
      PYQAttempt.aggregate(pipeline),
      PYQAttempt.countDocuments({ userId, bookmarked: true }),
    ]);

    // Strip isCorrect from options
    const sanitized = results.map((r) => ({
      ...r,
      pyq: stripAnswerData(r.pyq),
    }));

    res.json({
      success: true,
      data: sanitized,
      pagination: {
        total: countResult,
        page,
        limit,
        pages: Math.ceil(countResult / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's marked-for-revision PYQs
// @route   GET /api/pyqs/revision
// @access  Private
export const getRevisionList = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const pipeline = [
      { $match: { userId, markedForRevision: true } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'pyqs',
          localField: 'pyqId',
          foreignField: '_id',
          as: 'pyq',
        },
      },
      { $unwind: '$pyq' },
      {
        $lookup: {
          from: 'exams',
          localField: 'pyq.examId',
          foreignField: '_id',
          as: 'pyq._exam',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'pyq.subjectId',
          foreignField: '_id',
          as: 'pyq._subject',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $addFields: {
          'pyq.examId': { $arrayElemAt: ['$pyq._exam', 0] },
          'pyq.subjectId': { $arrayElemAt: ['$pyq._subject', 0] },
        },
      },
      {
        $project: {
          'pyq._exam': 0,
          'pyq._subject': 0,
          'pyq.explanation': 0,
        },
      },
    ];

    const [results, countResult] = await Promise.all([
      PYQAttempt.aggregate(pipeline),
      PYQAttempt.countDocuments({ userId, markedForRevision: true }),
    ]);

    const sanitized = results.map((r) => ({
      ...r,
      pyq: stripAnswerData(r.pyq),
    }));

    res.json({
      success: true,
      data: sanitized,
      pagination: {
        total: countResult,
        page,
        limit,
        pages: Math.ceil(countResult / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's attempt history
// @route   GET /api/pyqs/attempts
// @access  Private
export const getAttempts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const pipeline = [
      // Only include real attempts (not placeholder bookmarks with selectedOptionIndex=-1)
      { $match: { userId, selectedOptionIndex: { $gte: 0 } } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'pyqs',
          localField: 'pyqId',
          foreignField: '_id',
          as: 'pyq',
        },
      },
      { $unwind: '$pyq' },
      {
        $lookup: {
          from: 'exams',
          localField: 'pyq.examId',
          foreignField: '_id',
          as: 'pyq._exam',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'pyq.subjectId',
          foreignField: '_id',
          as: 'pyq._subject',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $addFields: {
          'pyq.examId': { $arrayElemAt: ['$pyq._exam', 0] },
          'pyq.subjectId': { $arrayElemAt: ['$pyq._subject', 0] },
        },
      },
      {
        $project: {
          'pyq._exam': 0,
          'pyq._subject': 0,
          'pyq.explanation': 0,
        },
      },
    ];

    const [results, countResult] = await Promise.all([
      PYQAttempt.aggregate(pipeline),
      PYQAttempt.countDocuments({ userId, selectedOptionIndex: { $gte: 0 } }),
    ]);

    const sanitized = results.map((r) => ({
      ...r,
      pyq: stripAnswerData(r.pyq),
    }));

    res.json({
      success: true,
      data: sanitized,
      pagination: {
        total: countResult,
        page,
        limit,
        pages: Math.ceil(countResult / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
