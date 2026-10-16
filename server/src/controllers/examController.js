import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

// @desc    Get all exams
// @route   GET /api/exams
// @access  Public
export const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({});
    res.json(exams);
  } catch (error) {
    next(error);
  }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Public
export const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (exam) {
      res.json(exam);
    } else {
      res.status(404);
      throw new Error('Exam not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin (Placeholder for admin auth)
export const createExam = async (req, res, next) => {
  try {
    const { name, description, level, metadata } = req.body;

    const examExists = await Exam.findOne({ name });
    if (examExists) {
      res.status(400);
      throw new Error('Exam already exists');
    }

    const exam = await Exam.create({
      name,
      description,
      level,
      metadata
    });

    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
export const updateExam = async (req, res, next) => {
  try {
    const { name, description, level, metadata } = req.body;

    const exam = await Exam.findById(req.params.id);

    if (exam) {
      exam.name = name || exam.name;
      exam.description = description || exam.description;
      exam.level = level || exam.level;
      if (metadata) {
        exam.metadata = metadata;
      }

      const updatedExam = await exam.save();
      res.json(updatedExam);
    } else {
      res.status(404);
      throw new Error('Exam not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get syllabus for an exam (Hierarchy)
// @route   GET /api/exams/:examId/syllabus
// @access  Public (or Student)
export const getExamSyllabus = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    // Fetch all active subjects for this exam
    const subjects = await Subject.find({ examId, active: true })
      .sort({ order: 1, name: 1 })
      .lean();

    // Fetch all active topics for this exam
    const topics = await Topic.find({ examId, active: true })
      .sort({ order: 1, name: 1 })
      .lean();

    // Map topics to their subjects
    const subjectsMap = {};
    subjects.forEach(subject => {
      subjectsMap[subject._id.toString()] = {
        ...subject,
        topics: []
      };
    });

    topics.forEach(topic => {
      // Filter and sort active subtopics
      topic.subtopics = (topic.subtopics || [])
        .filter(st => st.active !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      if (subjectsMap[topic.subjectId.toString()]) {
        subjectsMap[topic.subjectId.toString()].topics.push(topic);
      }
    });

    // Convert map to array maintaining original subject sort order
    const syllabus = subjects.map(subject => subjectsMap[subject._id.toString()]);

    res.json({
      exam: {
        _id: exam._id,
        name: exam.name,
        description: exam.description,
        level: exam.level
      },
      syllabus
    });
  } catch (error) {
    next(error);
  }
};
