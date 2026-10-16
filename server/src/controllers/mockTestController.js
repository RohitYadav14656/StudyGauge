import MockTest from '../models/MockTest.js';

// @desc    Create a new mock test entry
// @route   POST /api/mock-tests
// @access  Private
export const createMockTest = async (req, res) => {
  try {
    const {
      testName,
      exam,
      date,
      totalMarks,
      obtainedMarks,
      questionsAttempted,
      correct,
      wrong,
      timeTaken,
      subjectPerformance,
      topicPerformance,
    } = req.body;

    const mockTest = new MockTest({
      userId: req.user._id,
      testName,
      exam,
      date,
      totalMarks,
      obtainedMarks,
      questionsAttempted,
      correct,
      wrong,
      timeTaken,
      subjectPerformance,
      topicPerformance,
    });

    const createdMockTest = await mockTest.save();
    res.status(201).json(createdMockTest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all mock tests for a user
// @route   GET /api/mock-tests
// @access  Private
export const getMockTests = async (req, res) => {
  try {
    const mockTests = await MockTest.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(mockTests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a specific mock test by ID
// @route   GET /api/mock-tests/:id
// @access  Private
export const getMockTestById = async (req, res) => {
  try {
    const mockTest = await MockTest.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    res.json(mockTest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
