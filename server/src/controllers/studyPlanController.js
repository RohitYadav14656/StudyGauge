import StudyPlan from '../models/StudyPlan.js';
import StudyPlanItem from '../models/StudyPlanItem.js';
import Exam from '../models/Exam.js';
import Topic from '../models/Topic.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import { analyzePlanProgress, adaptStudyPlan } from '../services/adaptivePlannerService.js';

export const createStudyPlan = async (req, res) => {
  try {
    const { examId, title, startDate, endDate, notes } = req.body;
    const userId = req.user._id;

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

export const updateStudyPlanItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const item = await StudyPlanItem.findById(itemId).populate('studyPlanId');
    if (!item) {
      return res.status(404).json({ message: 'Study plan item not found' });
    }

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

export const deleteStudyPlanItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await StudyPlanItem.findById(itemId).populate('studyPlanId');
    if (!item) {
      return res.status(404).json({ message: 'Study plan item not found' });
    }

    if (item.studyPlanId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await item.deleteOne();

    res.json({ message: 'Study plan item removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const generateStudyPlan = async (req, res) => {
  try {
    const { examId, title, startDate, endDate, dailyStudyHours, preparationLevel } = req.body;
    const userId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const allTopics = await Topic.find({ examId, active: true }).sort({ subjectId: 1, order: 1 });

    const userProgress = await UserTopicProgress.find({ userId, examId });

    const completedTopicIds = new Set(
      userProgress
        .filter(p => p.status === 'Completed' || p.status === 'Revised')
        .map(p => p.topicId.toString())
    );

    const pendingTopics = allTopics.filter(topic => !completedTopicIds.has(topic._id.toString()));

    if (pendingTopics.length === 0) {
      return res.status(400).json({ message: 'No pending topics found to schedule.' });
    }

    const studyPlan = new StudyPlan({
      userId,
      examId,
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes: `Generated plan. Preparation Level: ${preparationLevel}`,
    });
    
    const createdPlan = await studyPlan.save();

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays <= 0) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    const itemsToCreate = [];

    let timePerTopicMinutes = 120;
    if (preparationLevel === 'advanced') timePerTopicMinutes = 60;
    if (preparationLevel === 'intermediate') timePerTopicMinutes = 90;

    let currentDayIndex = 0;
    let currentDayMinutesUsed = 0;
    const maxMinutesPerDay = dailyStudyHours * 60;

    for (let i = 0; i < pendingTopics.length; i++) {
      const topic = pendingTopics[i];

      if (currentDayMinutesUsed + timePerTopicMinutes > maxMinutesPerDay && currentDayMinutesUsed > 0) {
        currentDayIndex++;
        currentDayMinutesUsed = 0;
      }

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

