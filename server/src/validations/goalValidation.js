import Joi from 'joi';

export const createGoalSchema = Joi.object({
  title: Joi.string().required().trim(),
  period: Joi.string().valid('daily', 'weekly', 'monthly', 'long-term').required(),
  metric: Joi.string().valid('study_hours', 'topics_completed', 'pyqs_attempted', 'mock_tests_completed').required(),
  targetValue: Joi.number().min(0).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
});

export const updateGoalSchema = Joi.object({
  title: Joi.string().trim().optional(),
  period: Joi.string().valid('daily', 'weekly', 'monthly', 'long-term').optional(),
  metric: Joi.string().valid('study_hours', 'topics_completed', 'pyqs_attempted', 'mock_tests_completed').optional(),
  targetValue: Joi.number().min(0).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  status: Joi.string().valid('in-progress', 'achieved', 'abandoned', 'failed').optional(),
}).min(1);
