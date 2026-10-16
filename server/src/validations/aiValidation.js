import Joi from 'joi';

export const explainTopicSchema = Joi.object({
  topicName: Joi.string().trim().required().max(150),
  subjectName: Joi.string().trim().required().max(150),
  examName: Joi.string().trim().required().max(150),
  weaknessLevel: Joi.string().valid('STRONG', 'MODERATE', 'WEAK').default('WEAK'),
  accuracy: Joi.number().min(0).max(100).default(40),
  commonErrors: Joi.string().trim().max(300).allow('', null).default('Conceptual confusion'),
});

export const generateQuestionsSchema = Joi.object({
  topicName: Joi.string().trim().required().max(150),
  subjectName: Joi.string().trim().required().max(150),
  examName: Joi.string().trim().required().max(150),
  count: Joi.number().integer().min(1).max(5).default(2),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').default('Medium'),
});

export const studyAdviceSchema = Joi.object({
  examName: Joi.string().trim().required().max(150),
  daysRemaining: Joi.number().integer().min(0).required(),
  weakTopicsList: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .required(),
  gapSummary: Joi.string().trim().max(500).allow('', null).default('No recent schedule gaps detected'),
  consistencyScore: Joi.number().min(0).max(100).default(80),
});

export const askQuestionSchema = Joi.object({
  userQuery: Joi.string().trim().min(3).max(1000).required(),
  topicContext: Joi.string().trim().max(200).allow('', null).default('General Academic'),
});
