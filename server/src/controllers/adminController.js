import User from '../models/User.js';
import Exam from '../models/Exam.js';
import mongoose from 'mongoose';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExams = await Exam.countDocuments();
    
    // Safely count other collections if they exist, else return 0
    let totalSubjects = 0;
    let totalTopics = 0;
    let totalPYQs = 0;
    
    // We check if the model is registered to avoid crashes
    if (mongoose.models.Subject) {
      totalSubjects = await mongoose.models.Subject.countDocuments();
    }
    
    if (mongoose.models.Topic) {
      totalTopics = await mongoose.models.Topic.countDocuments();
    }
    
    if (mongoose.models.PYQ) {
      totalPYQs = await mongoose.models.PYQ.countDocuments();
    }

    res.json({
      totalUsers,
      totalExams,
      totalSubjects,
      totalTopics,
      totalPYQs
    });
  } catch (error) {
    next(error);
  }
};
