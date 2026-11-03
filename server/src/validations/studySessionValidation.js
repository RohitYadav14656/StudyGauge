import Joi from 'joi';

export const createStudySessionSchema = Joi.object({
  examId: Joi.string().hex().length(24).optional(),
  subjectId: Joi.string().hex().length(24).optional(),
  topicId: Joi.string().hex().length(24).optional(),
  studyPlanItemId: Joi.string().hex().length(24).optional(),
  date: Joi.date().required(),
  startTime: Joi.date().optional(),
  endTime: Joi.date().optional(),
  durationMinutes: Joi.number().min(0).optional(),
  studyType: Joi.string().valid('Lecture', 'Reading', 'Practice', 'PYQ', 'Mock Test', 'Revision').required(),
  notes: Joi.string().allow('', null).optional(),
  timerEvents: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('start', 'pause', 'resume', 'stop').required(),
      time: Joi.date().required()
    })
  ).optional()
});

export const updateStudySessionSchema = Joi.object({
  examId: Joi.string().hex().length(24).optional(),
  subjectId: Joi.string().hex().length(24).optional(),
  topicId: Joi.string().hex().length(24).optional(),
  studyPlanItemId: Joi.string().hex().length(24).optional(),
  date: Joi.date().optional(),
  startTime: Joi.date().optional(),
  endTime: Joi.date().optional(),
  durationMinutes: Joi.number().min(0).optional(),
  studyType: Joi.string().valid('Lecture', 'Reading', 'Practice', 'PYQ', 'Mock Test', 'Revision').optional(),
  notes: Joi.string().allow('', null).optional(),
  timerEvents: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('start', 'pause', 'resume', 'stop').required(),
      time: Joi.date().required()
    })
  ).optional()
}).min(1);
