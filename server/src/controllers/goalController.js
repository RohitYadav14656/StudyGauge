import Goal from '../models/Goal.js';
import StudySession from '../models/StudySession.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import PYQAttempt from '../models/PYQAttempt.js';
import MockTestResult from '../models/MockTestResult.js';

export const createGoal = async (req, res, next) => {
  try {
    const goalData = {
      ...req.body,
      userId: req.user._id,
    };
    
    const goal = await Goal.create(goalData);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ endDate: 1 });

    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        let currentValue = 0;
        const query = {
          userId: req.user._id,
          createdAt: { $gte: goal.startDate, $lte: goal.endDate }
        };
        
        switch (goal.metric) {
          case 'study_hours':

            const sessions = await StudySession.find({
              userId: req.user._id,
              date: { $gte: goal.startDate, $lte: goal.endDate }
            });
            const totalMinutes = sessions.reduce((acc, session) => acc + (session.durationMinutes || 0), 0);
            currentValue = parseFloat((totalMinutes / 60).toFixed(2));
            break;
            
          case 'topics_completed':

            currentValue = await UserTopicProgress.countDocuments({
              userId: req.user._id,
              status: 'Completed',
              updatedAt: { $gte: goal.startDate, $lte: goal.endDate }
            });
            break;
            
          case 'pyqs_attempted':
            currentValue = await PYQAttempt.countDocuments(query);
            break;
            
          case 'mock_tests_completed':
            currentValue = await MockTestResult.countDocuments(query);
            break;
        }

        let status = goal.status;
        if (status === 'in-progress' && currentValue >= goal.targetValue) {
          status = 'achieved';

        } else if (status === 'in-progress' && new Date() > goal.endDate) {
           status = 'failed';
        }

        return {
          ...goal.toObject(),
          currentValue,
          status
        };
      })
    );

    res.json(goalsWithProgress);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      res.status(404);
      throw new Error('Goal not found or you are not authorized to update it');
    }

    const updatedGoal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedGoal);
  } catch (error) {
    next(error);
  }
};
