import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';

export const getTopics = async (req, res, next) => {
  try {
    const { examId, subjectId, active } = req.query;
    
    let filter = {};
    if (examId) filter.examId = examId;
    if (subjectId) filter.subjectId = subjectId;
    if (active !== undefined) filter.active = active === 'true';

    const topics = await Topic.find(filter)
      .sort({ subjectId: 1, order: 1, name: 1 })
      .populate('examId', 'name')
      .populate('subjectId', 'name');
      
    res.json(topics);
  } catch (error) {
    next(error);
  }
};

export const getTopicById = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('examId', 'name')
      .populate('subjectId', 'name');
      
    if (!topic) {
      res.status(404);
      throw new Error('Topic not found');
    }
    res.json(topic);
  } catch (error) {
    next(error);
  }
};

export const createTopic = async (req, res, next) => {
  try {
    const { examId, subjectId, name, description, order, active, subtopics } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }
    if (subject.examId.toString() !== examId) {
      res.status(400);
      throw new Error('Data integrity error: Subject does not belong to the specified Exam');
    }

    const existing = await Topic.findOne({ subjectId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      res.status(400);
      throw new Error('Topic with this name already exists for this subject');
    }

    const topic = await Topic.create({
      examId,
      subjectId,
      name,
      description,
      order: order || 0,
      active: active !== undefined ? active : true,
      subtopics: subtopics || []
    });

    res.status(201).json(topic);
  } catch (error) {
    next(error);
  }
};

export const updateTopic = async (req, res, next) => {
  try {
    const { examId, subjectId, name, description, order, active, subtopics } = req.body;

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      res.status(404);
      throw new Error('Topic not found');
    }

    const targetExamId = examId || topic.examId;
    const targetSubjectId = subjectId || topic.subjectId;
    const targetName = name || topic.name;

    if (subjectId || examId) {
      const subject = await Subject.findById(targetSubjectId);
      if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
      }
      if (subject.examId.toString() !== targetExamId.toString()) {
        res.status(400);
        throw new Error('Data integrity error: Subject does not belong to the specified Exam');
      }
    }

    if (name || subjectId) {
      const existing = await Topic.findOne({
        _id: { $ne: topic._id },
        subjectId: targetSubjectId,
        name: { $regex: new RegExp(`^${targetName}$`, 'i') }
      });
      if (existing) {
        res.status(400);
        throw new Error('Topic with this name already exists for this subject');
      }
    }

    if (examId) topic.examId = examId;
    if (subjectId) topic.subjectId = subjectId;
    if (name) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (order !== undefined) topic.order = order;
    if (active !== undefined) topic.active = active;
    if (subtopics !== undefined) topic.subtopics = subtopics;

    const updatedTopic = await topic.save();
    res.json(updatedTopic);
  } catch (error) {
    next(error);
  }
};

export const updateTopicStatus = async (req, res, next) => {
  try {
    const { active } = req.body;
    
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      res.status(404);
      throw new Error('Topic not found');
    }

    topic.active = active;
    const updatedTopic = await topic.save();
    
    res.json(updatedTopic);
  } catch (error) {
    next(error);
  }
};
