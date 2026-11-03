import Joi from 'joi';

export const createOrUpdateRevisionSchema = Joi.object({
  topicId: Joi.string().hex().length(24).required(),
  action: Joi.string().valid('SCHEDULE', 'COMPLETE').default('COMPLETE'),
  studiedDate: Joi.date().optional(),
  lastRevisedDate: Joi.date().optional(),
  quality: Joi.number().min(0).max(5).optional().default(5),
  intervals: Joi.array().items(Joi.number().positive()).optional().default([1, 3, 7, 14, 30]),
});

export const getDueRevisionsQuerySchema = Joi.object({
  examId: Joi.string().hex().length(24).optional(),
  subjectId: Joi.string().hex().length(24).optional(),
  timezoneOffset: Joi.number().optional().default(0),
  targetDate: Joi.date().optional(),
});
