import aiService from '../services/ai/AIService.js';
import AILog from '../models/AILog.js';
import {
  explainTopicSchema,
  generateQuestionsSchema,
  studyAdviceSchema,
  askQuestionSchema,
} from '../validations/aiValidation.js';

export const explainTopic = async (req, res, next) => {
  try {
    const { error, value } = explainTopicSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const userId = req.user?._id || req.user?.id;
    const result = await aiService.explainWeakTopic({
      ...value,
      userId,
    });

    res.json({
      success: true,
      data: {
        explanation: result.text,
        metadata: result.metadata,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const generateQuestions = async (req, res, next) => {
  try {
    const { error, value } = generateQuestionsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const userId = req.user?._id || req.user?.id;
    const result = await aiService.generatePracticeQuestions({
      ...value,
      userId,
    });

    res.json({
      success: true,
      data: {
        questions: result.data.questions,
        topic: result.data.topic || value.topicName,
        subject: result.data.subject || value.subjectName,
        metadata: result.metadata,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getStudyAdvice = async (req, res, next) => {
  try {
    const { error, value } = studyAdviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const userId = req.user?._id || req.user?.id;
    const weakTopicsList = Array.isArray(value.weakTopicsList)
      ? value.weakTopicsList.join(', ')
      : value.weakTopicsList;

    const result = await aiService.generateStudyAdvice({
      ...value,
      weakTopicsList,
      userId,
    });

    res.json({
      success: true,
      data: {
        advice: result.text,
        metadata: result.metadata,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const askQuestion = async (req, res, next) => {
  try {
    const { error, value } = askQuestionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const userId = req.user?._id || req.user?.id;
    const result = await aiService.answerStudyQuestion({
      ...value,
      userId,
    });

    res.json({
      success: true,
      data: {
        answer: result.text,
        metadata: result.metadata,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUsageStats = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const stats = await AILog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          totalCalls: { $sum: 1 },
          totalTokens: { $sum: '$totalTokens' },
          avgLatencyMs: { $avg: '$latencyMs' },
          totalEstimatedCost: { $sum: '$costEstimate' },
        },
      },
    ]);

    const taskBreakdown = await AILog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$taskType',
          count: { $sum: 1 },
          tokens: { $sum: '$totalTokens' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: stats,
        taskBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};
