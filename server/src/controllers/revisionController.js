import {
  getDueRevisions,
  createOrUpdateRevision,
  seedDemoRevisions,
  getAllUserRevisions,
} from '../services/revisionService.js';
import {
  createOrUpdateRevisionSchema,
  getDueRevisionsQuerySchema,
} from '../validations/revisionValidation.js';

export const getDueRevisionsController = async (req, res, next) => {
  try {
    const { error, value } = getDueRevisionsQuerySchema.validate(req.query);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const userId = req.user._id;
    const result = await getDueRevisions(userId, value);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateRevisionController = async (req, res, next) => {
  try {
    const { error, value } = createOrUpdateRevisionSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const userId = req.user._id;
    const result = await createOrUpdateRevision(userId, value);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const seedDemoRevisionsController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { examId } = req.body;
    const result = await seedDemoRevisions(userId, examId);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Demo spaced revision queue created with active recall intervals!',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRevisionsController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { examId } = req.query;
    const result = await getAllUserRevisions(userId, { examId });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
