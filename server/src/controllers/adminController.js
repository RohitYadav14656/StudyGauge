import User from '../models/User.js';
import Exam from '../models/Exam.js';
import mongoose from 'mongoose';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExams = await Exam.countDocuments();

    let totalSubjects = 0;
    let totalTopics = 0;
    let totalPYQs = 0;

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
