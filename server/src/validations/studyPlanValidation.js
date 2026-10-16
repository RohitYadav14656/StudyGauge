import Joi from 'joi';

export const createStudyPlanSchema = Joi.object({
  examId: Joi.string().required(),
  title: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null, '').optional(),
  notes: Joi.string().allow('', null).optional(),
});

export const createStudyPlanItemSchema = Joi.object({
  examId: Joi.string().required(),
  topicId: Joi.string().allow(null, '').optional(),
  subjectId: Joi.string().allow(null, '').optional(),
  title: Joi.string().allow('', null).optional(),
  date: Joi.date().iso().required(),
  plannedDuration: Joi.number().min(1).default(60),
  activityType: Joi.string().valid('reading', 'revision', 'practice', 'mock_test', 'other').default('reading'),
  priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
  notes: Joi.string().allow('', null).optional(),
});

export const generateStudyPlanSchema = Joi.object({
  examId: Joi.string().required(),
  title: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  dailyStudyHours: Joi.number().min(1).max(24).required(),
  preparationLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
});

export const updateStudyPlanItemSchema = Joi.object({
  status: Joi.string().valid('planned', 'in_progress', 'completed', 'partially_completed', 'missed', 'rescheduled'),
  completion: Joi.number().min(0).max(100),
  actualDuration: Joi.number().min(0),
  notes: Joi.string().allow('', null).optional(),
  date: Joi.date().iso(),
  plannedDuration: Joi.number().min(1),
  activityType: Joi.string().valid('reading', 'revision', 'practice', 'mock_test', 'other'),
  priority: Joi.string().valid('high', 'medium', 'low'),
  title: Joi.string().allow('', null).optional(),
}).min(1);

export const adaptStudyPlanSchema = Joi.object({
  currentDate: Joi.date().iso().optional(),
  dailyStudyHours: Joi.number().min(1).max(16).default(4).optional(),
  protectRevisionRatio: Joi.number().min(0.1).max(0.5).default(0.25).optional(),
  previewOnly: Joi.boolean().default(false).optional(),
});

