import MockTest from '../models/MockTest.js';

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

export const getMockTests = async (req, res) => {
  try {
    const mockTests = await MockTest.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(mockTests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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
