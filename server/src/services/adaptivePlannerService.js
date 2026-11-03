import mongoose from 'mongoose';
import StudyPlan from '../models/StudyPlan.js';
import StudyPlanItem from '../models/StudyPlanItem.js';
import UserExam from '../models/UserExam.js';
import Revision from '../models/Revision.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import { getTopicRecommendations } from './recommendationService.js';
import { getTopicAnalyticsWithWeaknessEngine } from './analyticsService.js';

export const analyzePlanProgress = async (studyPlanId, options = {}) => {
  const studyPlan = await StudyPlan.findById(studyPlanId).populate('examId');
  if (!studyPlan) {
    throw new Error('Study plan not found');
  }

  const userId = studyPlan.userId;
  const examId = studyPlan.examId._id || studyPlan.examId;
  const refDate = options.currentDate ? new Date(options.currentDate) : new Date();

  const items = await StudyPlanItem.find({ studyPlanId })
    .populate('topicId', 'name')
    .populate('subjectId', 'name')
    .sort({ date: 1 });

  const topicAnalyticsRes = await getTopicAnalyticsWithWeaknessEngine(userId.toString(), { examId: examId.toString() });
  const topicList = topicAnalyticsRes.topics || [];
  const recommendationRes = await getTopicRecommendations(userId.toString(), { limit: 50 });
  const recommendations = recommendationRes.recommendations || [];

  const recMap = new Map();
  recommendations.forEach((r) => {
    recMap.set(r.topic.id.toString(), r);
  });

  const topicAnalyticsMap = new Map();
  topicList.forEach((t) => {
    topicAnalyticsMap.set(t.topicId.toString(), t);
  });

  const overdueRevisionsRaw = await Revision.find({
    userId,
    status: { $in: ['OVERDUE', 'DUE'] },
  }).populate('topicId', 'name subjectId');

  const overdueRevisions = overdueRevisionsRaw.map((r) => {
    const topicIdStr = r.topicId?._id?.toString() || r.topicId?.toString();
    const rec = recMap.get(topicIdStr);
    const diffMs = refDate.getTime() - new Date(r.nextRevisionDate || r.nextReviewDate || refDate).getTime();
    const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    return {
      revisionId: r._id,
      topicId: r.topicId?._id || r.topicId,
      topicName: r.topicId?.name || 'Unknown Topic',
      nextRevisionDate: r.nextRevisionDate || r.nextReviewDate,
      daysOverdue,
      status: r.status,
      priorityScore: rec ? rec.priority.score : 70,
    };
  });

  const missedTasks = [];
  const partiallyCompletedTasks = [];
  const completedTasks = [];
  const atRiskPostponedTasks = [];

  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;

  items.forEach((item) => {
    totalPlannedMinutes += item.plannedDuration || 0;
    totalActualMinutes += item.actualDuration || 0;

    const itemDate = new Date(item.date);
    const isPastOrToday = itemDate <= refDate;

    if (item.status === 'completed' || item.completion === 100) {
      completedTasks.push({
        id: item._id,
        title: item.title,
        date: item.date,
        topicId: item.topicId,
        plannedDuration: item.plannedDuration,
        actualDuration: item.actualDuration,
        completion: item.completion,
      });
    } else if (item.status === 'partially_completed' || (item.completion > 0 && item.completion < 100)) {
      partiallyCompletedTasks.push({
        id: item._id,
        title: item.title,
        date: item.date,
        topicId: item.topicId,
        plannedDuration: item.plannedDuration,
        actualDuration: item.actualDuration,
        completion: item.completion,
        remainingMinutes: Math.round((item.plannedDuration || 60) * (1 - (item.completion || 0) / 100)),
        rescheduleCount: item.rescheduleCount || 0,
      });
    } else if (isPastOrToday && (item.status === 'missed' || item.status === 'planned' || item.status === 'in_progress')) {
      missedTasks.push({
        id: item._id,
        title: item.title,
        date: item.date,
        topicId: item.topicId,
        plannedDuration: item.plannedDuration,
        actualDuration: item.actualDuration,
        completion: item.completion || 0,
        rescheduleCount: item.rescheduleCount || 0,
      });
    }

    if (item.rescheduleCount >= 2 && item.completion < 100 && item.status !== 'completed') {
      atRiskPostponedTasks.push({
        id: item._id,
        title: item.title,
        date: item.date,
        topicId: item.topicId,
        rescheduleCount: item.rescheduleCount,
        priority: item.priority,
        reason: 'Task has been repeatedly postponed (>= 2 times)',
      });
    }
  });

  const decliningPerformanceTopics = topicList
    .filter((t) => {
      const rec = recMap.get(t.topicId.toString());
      const trendDelta = t.totalAttempts > 0 ? (t.recentAccuracy !== undefined ? t.recentAccuracy : t.accuracy) - (t.pyqAccuracy || t.accuracy || 0) : 0;
      return t.classification === 'WEAK' || trendDelta <= -15 || (rec && rec.reasonCodes.includes('PERFORMANCE_DECLINING'));
    })
    .map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      subjectName: t.subjectName,
      accuracy: t.accuracy,
      recentAccuracy: t.recentAccuracy,
      masteryScore: t.masteryScore,
      classification: t.classification,
      priorityScore: recMap.get(t.topicId.toString())?.priority.score || 75,
    }));

  const overallCompletionPercentage = totalPlannedMinutes > 0 ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100) : 0;

  return {
    studyPlan: {
      id: studyPlan._id,
      title: studyPlan.title,
      examId: examId,
      startDate: studyPlan.startDate,
      endDate: studyPlan.endDate,
    },
    referenceDate: refDate.toISOString(),
    metrics: {
      totalTasks: items.length,
      completedTasksCount: completedTasks.length,
      partiallyCompletedTasksCount: partiallyCompletedTasks.length,
      missedTasksCount: missedTasks.length,
      overdueRevisionsCount: overdueRevisions.length,
      decliningPerformanceTopicsCount: decliningPerformanceTopics.length,
      atRiskPostponedTasksCount: atRiskPostponedTasks.length,
      overallCompletionPercentage,
      totalPlannedMinutes,
      totalActualMinutes,
    },
    gapsDetected: {
      missedTasks,
      partiallyCompletedTasks,
      completedTasks,
      decliningPerformanceTopics,
      overdueRevisions,
      atRiskPostponedTasks,
    },
  };
};

export const adaptStudyPlan = async (studyPlanId, options = {}) => {
  const studyPlan = await StudyPlan.findById(studyPlanId).populate('examId');
  if (!studyPlan) {
    throw new Error('Study plan not found');
  }

  const userId = studyPlan.userId;
  const examId = studyPlan.examId._id || studyPlan.examId;
  const refDate = options.currentDate ? new Date(options.currentDate) : new Date();

  const startDate = new Date(refDate);
  startDate.setUTCHours(0, 0, 0, 0);

  let targetEndDate = studyPlan.endDate ? new Date(studyPlan.endDate) : new Date(startDate.getTime() + 30 * 86400000);
  const userExam = await UserExam.findOne({ userId, examId, status: 'active' });
  if (userExam && userExam.targetDate) {
    const examTarget = new Date(userExam.targetDate);
    if (examTarget < targetEndDate) {
      targetEndDate = examTarget;
    }
  }

  const dailyStudyHours = Math.max(1, Math.min(16, parseFloat(options.dailyStudyHours) || 4));
  const maxDailyMinutes = Math.round(dailyStudyHours * 60);

  const protectRevisionRatio = Math.max(0.1, Math.min(0.5, parseFloat(options.protectRevisionRatio) || 0.25));
  const maxRevisionMinutesPerDay = Math.round(maxDailyMinutes * protectRevisionRatio);

  const analysis = await analyzePlanProgress(studyPlanId, { currentDate: refDate });
  const { missedTasks, partiallyCompletedTasks, decliningPerformanceTopics, overdueRevisions, atRiskPostponedTasks } = analysis.gapsDetected;

  const existingItems = await StudyPlanItem.find({ studyPlanId }).sort({ date: 1 });

  const recRes = await getTopicRecommendations(userId.toString(), { limit: 100 });
  const recs = recRes.recommendations || [];
  const topicPriorityMap = new Map();
  recs.forEach((r) => {
    topicPriorityMap.set(r.topic.id.toString(), r.priority.score);
  });

  const pastCompletedItemIds = new Set();
  const candidatePool = [];

  existingItems.forEach((item) => {
    const itemDate = new Date(item.date);
    itemDate.setUTCHours(0, 0, 0, 0);

    if (itemDate < startDate) {
      if (item.status === 'completed' || item.completion === 100) {
        pastCompletedItemIds.add(item._id.toString());
      } else {

        item.status = 'missed';
        item.rescheduleCount = (item.rescheduleCount || 0) + 1;
        item.save();

        candidatePool.push({
          existingItemId: item._id,
          examId,
          topicId: item.topicId?._id || item.topicId,
          subjectId: item.subjectId?._id || item.subjectId,
          title: item.title || 'Rescheduled Study',
          plannedDuration: item.plannedDuration || 60,
          activityType: item.activityType || 'reading',
          priority: item.rescheduleCount >= 1 ? 'high' : item.priority || 'medium',
          rescheduleCount: item.rescheduleCount || 0,
          originalDate: item.originalDate || item.date,
          adaptationReason: item.rescheduleCount >= 2
            ? 'Priority locked to prevent repeated postponement'
            : 'Rescheduled from missed past session',
          isProtectedRevision: item.activityType === 'revision',
          priorityScore: item.rescheduleCount >= 2 ? 100 : (topicPriorityMap.get(item.topicId?.toString()) || 50),
        });
      }
    } else {

      if (item.status === 'partially_completed' || (item.completion > 0 && item.completion < 100)) {
        const remainingMinutes = Math.max(30, Math.round((item.plannedDuration || 60) * (1 - item.completion / 100)));
        candidatePool.push({
          existingItemId: item._id,
          examId,
          topicId: item.topicId?._id || item.topicId,
          subjectId: item.subjectId?._id || item.subjectId,
          title: `[Continuation] ${item.title}`,
          plannedDuration: remainingMinutes,
          activityType: item.activityType || 'reading',
          priority: item.priority || 'high',
          rescheduleCount: (item.rescheduleCount || 0) + 1,
          originalDate: item.originalDate || item.date,
          adaptationReason: `Rescheduled remaining ${100 - item.completion}% of partially completed task`,
          isProtectedRevision: item.activityType === 'revision',
          priorityScore: (topicPriorityMap.get(item.topicId?.toString()) || 50) + 15,
        });
      } else if (item.status !== 'completed' && item.completion < 100) {
        candidatePool.push({
          existingItemId: item._id,
          examId,
          topicId: item.topicId?._id || item.topicId,
          subjectId: item.subjectId?._id || item.subjectId,
          title: item.title,
          plannedDuration: item.plannedDuration || 60,
          activityType: item.activityType || 'reading',
          priority: item.priority || 'medium',
          rescheduleCount: item.rescheduleCount || 0,
          originalDate: item.originalDate || item.date,
          adaptationReason: item.adaptationReason || 'Scheduled plan task',
          isProtectedRevision: item.activityType === 'revision',
          priorityScore: item.rescheduleCount >= 2 ? 95 : (topicPriorityMap.get(item.topicId?.toString()) || 50),
        });
      }
    }
  });

  overdueRevisions.forEach((rev) => {
    const topicIdStr = rev.topicId.toString();
    const alreadyInPool = candidatePool.some((c) => c.topicId?.toString() === topicIdStr && c.activityType === 'revision');
    if (!alreadyInPool) {
      candidatePool.push({
        examId,
        topicId: rev.topicId,
        subjectId: null,
        title: `Spaced Revision: ${rev.topicName}`,
        plannedDuration: 30,
        activityType: 'revision',
        priority: 'high',
        rescheduleCount: 0,
        originalDate: refDate,
        adaptationReason: `Protected Spaced Revision (Overdue by ${rev.daysOverdue} days)`,
        isProtectedRevision: true,
        priorityScore: 90 + Math.min(10, rev.daysOverdue),
      });
    }
  });

  decliningPerformanceTopics.forEach((dp) => {
    const topicIdStr = dp.topicId.toString();
    const alreadyInPool = candidatePool.some((c) => c.topicId?.toString() === topicIdStr && c.activityType === 'practice');
    if (!alreadyInPool) {
      candidatePool.push({
        examId,
        topicId: dp.topicId,
        subjectId: null,
        title: `Remedial PYQ Practice: ${dp.topicName}`,
        plannedDuration: 45,
        activityType: 'practice',
        priority: 'high',
        rescheduleCount: 0,
        originalDate: refDate,
        adaptationReason: `Remedial Practice for Declining Accuracy (${dp.accuracy}%)`,
        isProtectedRevision: false,
        priorityScore: 85,
      });
    }
  });

  candidatePool.sort((a, b) => {
    if (a.rescheduleCount >= 2 && b.rescheduleCount < 2) return -1;
    if (b.rescheduleCount >= 2 && a.rescheduleCount < 2) return 1;
    return b.priorityScore - a.priorityScore;
  });

  const timeDiffMs = targetEndDate.getTime() - startDate.getTime();
  const availableDays = Math.max(1, Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24)) + 1);

  const daySchedules = [];
  for (let i = 0; i < availableDays; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    daySchedules.push({
      date: d,
      totalMinutes: 0,
      revisionMinutes: 0,
      items: [],
    });
  }

  const unassignedCandidates = [];

  candidatePool.forEach((cand) => {
    let assigned = false;

    if (cand.rescheduleCount >= 2) {
      cand.priority = 'high';
      cand.adaptationReason = 'Locked into immediate next slot to prevent repeated postponement';
    }

    for (let dIdx = 0; dIdx < daySchedules.length; dIdx++) {
      const day = daySchedules[dIdx];
      const taskDuration = cand.plannedDuration;

      if (day.totalMinutes + taskDuration <= maxDailyMinutes) {
        day.items.push({ ...cand, date: day.date });
        day.totalMinutes += taskDuration;
        if (cand.isProtectedRevision || cand.activityType === 'revision') {
          day.revisionMinutes += taskDuration;
        }
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      unassignedCandidates.push(cand);
    }
  });

  if (options.previewOnly) {
    return {
      preview: true,
      referenceDate: refDate,
      dailyStudyHours,
      maxDailyMinutes,
      protectRevisionRatio,
      totalCandidates: candidatePool.length,
      scheduledItemsCount: candidatePool.length - unassignedCandidates.length,
      unassignedItemsCount: unassignedCandidates.length,
      daySchedules,
      unassignedCandidates,
    };
  }

  const futureCutoffDate = new Date(startDate);
  await StudyPlanItem.deleteMany({
    studyPlanId,
    date: { $gte: futureCutoffDate },
    status: { $ne: 'completed' },
  });

  const newDbItems = [];
  daySchedules.forEach((day) => {
    day.items.forEach((item) => {
      newDbItems.push({
        studyPlanId,
        examId: item.examId,
        topicId: item.topicId,
        subjectId: item.subjectId,
        title: item.title,
        date: day.date,
        plannedDuration: item.plannedDuration,
        activityType: item.activityType,
        priority: item.priority,
        status: 'planned',
        completion: 0,
        actualDuration: 0,
        rescheduleCount: item.rescheduleCount,
        originalDate: item.originalDate || day.date,
        adaptationReason: item.adaptationReason,
        isProtectedRevision: item.isProtectedRevision || item.activityType === 'revision',
      });
    });
  });

  let createdItems = [];
  if (newDbItems.length > 0) {
    createdItems = await StudyPlanItem.insertMany(newDbItems);
  }

  return {
    success: true,
    studyPlanId,
    adaptedAt: new Date().toISOString(),
    metrics: {
      referenceDate: refDate.toISOString(),
      dailyStudyHours,
      maxDailyMinutes,
      protectRevisionRatio,
      totalGapsIdentified: missedTasks.length + partiallyCompletedTasks.length + overdueRevisions.length + decliningPerformanceTopics.length,
      rescheduledTasksCount: missedTasks.length + partiallyCompletedTasks.length,
      injectedRevisionsCount: overdueRevisions.length,
      injectedRemedialTasksCount: decliningPerformanceTopics.length,
      newItemsCreatedCount: createdItems.length,
      unassignedTasksCount: unassignedCandidates.length,
    },
    schedule: daySchedules.map((ds) => ({
      date: ds.date,
      totalPlannedMinutes: ds.totalMinutes,
      revisionMinutes: ds.revisionMinutes,
      itemsCount: ds.items.length,
    })),
  };
};
