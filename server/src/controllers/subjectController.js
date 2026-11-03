import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';

export const getSubjects = async (req, res, next) => {
  try {
    const { examId, active } = req.query;
    
    let filter = {};
    if (examId) filter.examId = examId;
    if (active !== undefined) filter.active = active === 'true';

    const subjects = await Subject.find(filter)
      .sort({ order: 1, name: 1 })
      .populate('examId', 'name');
      
    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('examId', 'name');
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }
    res.json(subject);
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { examId, name, shortName, description, order, active, weightage } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }

    const existing = await Subject.findOne({ examId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      res.status(400);
      throw new Error('Subject with this name already exists for this exam');
    }

    const subject = await Subject.create({
      examId,
      name,
      shortName,
      description,
      order: order || 0,
      active: active !== undefined ? active : true,
      weightage
    });

    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { name, shortName, description, order, active, weightage, examId } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }

    const targetExamId = examId || subject.examId;
    const targetName = name || subject.name;
    
    if (name || examId) {
      const existing = await Subject.findOne({
        _id: { $ne: subject._id },
        examId: targetExamId,
        name: { $regex: new RegExp(`^${targetName}$`, 'i') }
      });
      if (existing) {
        res.status(400);
        throw new Error('Subject with this name already exists for this exam');
      }
    }

    if (examId && examId !== subject.examId.toString()) {
      const exam = await Exam.findById(examId);
      if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
      }
      subject.examId = examId;
    }

    if (name) subject.name = name;
    if (shortName !== undefined) subject.shortName = shortName;
    if (description !== undefined) subject.description = description;
    if (order !== undefined) subject.order = order;
    if (active !== undefined) subject.active = active;
    if (weightage !== undefined) subject.weightage = weightage;

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } catch (error) {
    next(error);
  }
};

export const updateSubjectStatus = async (req, res, next) => {
  try {
    const { active } = req.body;
    
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      res.status(404);
      throw new Error('Subject not found');
    }

    subject.active = active;
    const updatedSubject = await subject.save();
    
    res.json(updatedSubject);
  } catch (error) {
    next(error);
  }
};
