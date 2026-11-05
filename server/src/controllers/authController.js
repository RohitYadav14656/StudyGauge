import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !validateEmail(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: cleanEmail,
      passwordHash,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !validateEmail(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

export const logoutUser = (req, res) => {

  res.json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req, res, next) => {
  try {

    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      if (req.body.email) {
        if (!validateEmail(req.body.email)) {
          res.status(400);
          throw new Error('Please enter a valid email address.');
        }
        user.email = req.body.email.trim().toLowerCase();
      }

      user.preferredStudyTime = req.body.preferredStudyTime || user.preferredStudyTime;
      
      if (req.body.availableDailyHours !== undefined) {
        user.availableDailyHours = req.body.availableDailyHours;
      }
      
      user.preparationLevel = req.body.preparationLevel || user.preparationLevel;
      
      if (req.body.targetInformation !== undefined) {
        user.targetInformation = req.body.targetInformation;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        preferredStudyTime: updatedUser.preferredStudyTime,
        availableDailyHours: updatedUser.availableDailyHours,
        preparationLevel: updatedUser.preparationLevel,
        targetInformation: updatedUser.targetInformation,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
