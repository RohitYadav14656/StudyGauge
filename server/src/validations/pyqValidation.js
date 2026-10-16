import Joi from 'joi';

export const attemptPYQSchema = {
  body: Joi.object().keys({
    selectedOptionIndex: Joi.number().required().integer().min(0).messages({
      'number.base': 'Selected option must be a number',
      'number.min': 'Selected option index cannot be negative',
      'any.required': 'selectedOptionIndex is required',
    }),
    timeTakenSeconds: Joi.number().optional().integer().min(0).messages({
      'number.min': 'Time taken cannot be negative',
    }),
  }),
};

export const getPYQsQuerySchema = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    examId: Joi.string().hex().length(24).optional(),
    subjectId: Joi.string().hex().length(24).optional(),
    topicId: Joi.string().hex().length(24).optional(),
    year: Joi.number().integer().min(1900).max(2100).optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    tags: Joi.string().optional(),
    search: Joi.string().max(200).optional().trim(),
  }),
};
