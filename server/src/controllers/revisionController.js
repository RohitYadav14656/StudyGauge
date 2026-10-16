import {
  getDueRevisions,
  createOrUpdateRevision,
} from '../services/revisionService.js';
import {
  createOrUpdateRevisionSchema,
  getDueRevisionsQuerySchema,
} from '../validations/revisionValidation.js';

// @desc    Get revisions due today or overdue
// @route   GET /api/revisions/due
// @access  Private
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

// @desc    Schedule or log completion of a topic revision
// @route   POST /api/revisions
// @access  Private
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
