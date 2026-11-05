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

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'student' or 'admin'.",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.',
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: 'User successfully removed.',
    });
  } catch (error) {
    next(error);
  }
};
