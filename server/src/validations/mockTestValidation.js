import Joi from 'joi';

export const createMockTestSchema = {
  body: Joi.object().keys({
    testName: Joi.string().required().trim(),
    exam: Joi.string().required().trim(),
    date: Joi.date().required(),
    totalMarks: Joi.number().required().min(0),
    obtainedMarks: Joi.number().required().min(0).max(Joi.ref('totalMarks')),
    questionsAttempted: Joi.number().required().min(0).integer(),
    correct: Joi.number().required().min(0).integer().max(Joi.ref('questionsAttempted')),
    wrong: Joi.number().required().min(0).integer(),
    timeTaken: Joi.number().required().min(0), // minutes
    subjectPerformance: Joi.array().items(
      Joi.object().keys({
        subject: Joi.string().required(),
        score: Joi.number().required(),
      })
    ).optional(),
    topicPerformance: Joi.array().items(
      Joi.object().keys({
        topic: Joi.string().required(),
        score: Joi.number().required(),
      })
    ).optional(),
  }).custom((value, helpers) => {
      if (value.correct + value.wrong > value.questionsAttempted) {
          return helpers.message('Correct and wrong questions cannot exceed questions attempted');
      }
      return value;
  }),
};
