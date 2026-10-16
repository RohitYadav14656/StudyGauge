import StudyPlan from '../models/StudyPlan.js';
import StudyPlanItem from '../models/StudyPlanItem.js';
import Exam from '../models/Exam.js';
import Topic from '../models/Topic.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import { analyzePlanProgress, adaptStudyPlan } from '../services/adaptivePlannerService.js';
// @desc    Create a new study plan
// @route   POST /api/study-plans
// @access  Private
export const createStudyPlan = async (req, res) => {
  try {
    const { examId, title, startDate, endDate, notes } = req.body;
    const userId = req.user._id;

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const studyPlan = new StudyPlan({
      userId,
      examId,
      title,
      startDate,
      endDate,
      notes,
    });

    const createdPlan = await studyPlan.save();
    res.status(201).json(createdPlan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all study plans for a user
// @route   GET /api/study-plans
// @access  Private
export const getStudyPlans = async (req, res) => {
  try {
    const studyPlans = await StudyPlan.find({ userId: req.user._id })
      .populate('examId', 'name')
      .sort({ createdAt: -1 });

    res.json(studyPlans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get study plan by ID
// @route   GET /api/study-plans/:id
// @access  Private
export const getStudyPlanById = async (req, res) => {
  try {
    const planId = req.params.id;

    const studyPlan = await StudyPlan.findOne({ _id: planId, userId: req.user._id })
      .populate('examId', 'name');

    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }

    res.json(studyPlan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a study plan item
// @route   POST /api/study-plans/:planId/items
// @access  Private
export const createStudyPlanItem = async (req, res) => {
  try {
    const { planId } = req.params;
    const {
      examId,
      topicId,
      subjectId,
      title,
      date,
      plannedDuration,
      activityType,
      priority,
      notes,
    } = req.body;

    // Verify study plan belongs to user
    const studyPlan = await StudyPlan.findOne({ _id: planId, userId: req.user._id });
    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found or not authorized' });
    }

    const item = new StudyPlanItem({
      studyPlanId: planId,
      examId,
      topicId: topicId || null,
      subjectId: subjectId || null,
      title,
      date,
      plannedDuration,
      activityType,
      priority,
      notes,
      status: 'planned',
      completion: 0,
      actualDuration: 0,
    });

    const createdItem = await item.save();
    res.status(201).json(createdItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get study plan items
// @route   GET /api/study-plans/:planId/items
// @access  Private
export const getStudyPlanItems = async (req, res) => {
  try {
    const { planId } = req.params;
    const { startDate, endDate } = req.query;

    const studyPlan = await StudyPlan.findOne({ _id: planId, userId: req.user._id });
    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found or not authorized' });
    }

    let query = { studyPlanId: planId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const items = await StudyPlanItem.find(query)
      .populate('topicId', 'name')
      .populate('subjectId', 'name')
      .sort({ date: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a study plan item
// @route   PUT /api/study-plans/items/:itemId
// @access  Private
export const updateStudyPlanItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const item = await StudyPlanItem.findById(itemId).populate('studyPlanId');
    if (!item) {
      return res.status(404).json({ message: 'Study plan item not found' });
    }

    // Verify owner
    if (item.studyPlanId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedItem = await StudyPlanItem.findByIdAndUpdate(
      itemId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a study plan item
// @route   DELETE /api/study-plans/items/:itemId
// @access  Private
export const deleteStudyPlanItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await StudyPlanItem.findById(itemId).populate('studyPlanId');
    if (!item) {
      return res.status(404).json({ message: 'Study plan item not found' });
    }

    // Verify owner
    if (item.studyPlanId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await item.deleteOne();

    res.json({ message: 'Study plan item removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate a deterministic study plan
// @route   POST /api/study-plans/generate
// @access  Private
export const generateStudyPlan = async (req, res) => {
  try {
    const { examId, title, startDate, endDate, dailyStudyHours, preparationLevel } = req.body;
    const userId = req.user._id;

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // 1. Fetch all topics for the exam
    const allTopics = await Topic.find({ examId, active: true }).sort({ subjectId: 1, order: 1 });
    
    // 2. Fetch user's topic progress
    const userProgress = await UserTopicProgress.find({ userId, examId });
    
    // Map of completed topics
    const completedTopicIds = new Set(
      userProgress
        .filter(p => p.status === 'Completed' || p.status === 'Revised')
        .map(p => p.topicId.toString())
    );

    // 3. Filter pending topics
    const pendingTopics = allTopics.filter(topic => !completedTopicIds.has(topic._id.toString()));

    if (pendingTopics.length === 0) {
      return res.status(400).json({ message: 'No pending topics found to schedule.' });
    }

    // 4. Create the main StudyPlan
    const studyPlan = new StudyPlan({
      userId,
      examId,
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes: `Generated plan. Preparation Level: ${preparationLevel}`,
    });
    
    const createdPlan = await studyPlan.save();

    // 5. Deterministic scheduling logic
    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Difference in days (inclusive)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays <= 0) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    const itemsToCreate = [];
    
    // Configurable time per topic based on prep level
    let timePerTopicMinutes = 120; // default 2 hours
    if (preparationLevel === 'advanced') timePerTopicMinutes = 60;
    if (preparationLevel === 'intermediate') timePerTopicMinutes = 90;

    let currentDayIndex = 0;
    let currentDayMinutesUsed = 0;
    const maxMinutesPerDay = dailyStudyHours * 60;

    for (let i = 0; i < pendingTopics.length; i++) {
      const topic = pendingTopics[i];
      
      // If adding this topic exceeds the day's limit and we aren't at the start of the day
      if (currentDayMinutesUsed + timePerTopicMinutes > maxMinutesPerDay && currentDayMinutesUsed > 0) {
        currentDayIndex++;
        currentDayMinutesUsed = 0;
      }
      
      // If we run out of days, just cram remaining into the last day (simplistic approach for now)
      if (currentDayIndex >= diffDays) {
        currentDayIndex = diffDays - 1;
      }

      const scheduleDate = new Date(start);
      scheduleDate.setDate(scheduleDate.getDate() + currentDayIndex);

      itemsToCreate.push({
        studyPlanId: createdPlan._id,
        examId,
        topicId: topic._id,
        subjectId: topic.subjectId,
        title: `Study: ${topic.name}`,
        date: scheduleDate,
        plannedDuration: timePerTopicMinutes,
        activityType: 'reading',
        priority: 'medium',
        status: 'planned',
        completion: 0,
        actualDuration: 0,
      });

      currentDayMinutesUsed += timePerTopicMinutes;
    }

    // Bulk insert items
    await StudyPlanItem.insertMany(itemsToCreate);

    res.status(201).json({
      studyPlan: createdPlan,
      itemsCount: itemsToCreate.length,
      message: 'Study plan generated successfully',
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Analyze study plan progress comparing planned vs actual activity
// @route   GET /api/study-plans/:planId/adapt/analysis
// @access  Private
export const analyzeStudyPlanProgress = async (req, res) => {
  try {
    const { planId } = req.params;
    const { currentDate } = req.query;

    const studyPlan = await StudyPlan.findOne({ _id: planId, userId: req.user._id });
    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found or not authorized' });
    }

    const analysis = await analyzePlanProgress(planId, { currentDate });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Adapt study plan items based on progress analysis and constraints
// @route   POST /api/study-plans/:planId/adapt
// @access  Private
export const adaptStudyPlanController = async (req, res) => {
  try {
    const { planId } = req.params;
    const { currentDate, dailyStudyHours, protectRevisionRatio, previewOnly } = req.body;

    const studyPlan = await StudyPlan.findOne({ _id: planId, userId: req.user._id });
    if (!studyPlan) {
      return res.status(404).json({ message: 'Study plan not found or not authorized' });
    }

    const result = await adaptStudyPlan(planId, {
      currentDate,
      dailyStudyHours,
      protectRevisionRatio,
      previewOnly,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

