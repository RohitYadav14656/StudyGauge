import mongoose from 'mongoose';
import { getTopicAnalyticsWithWeaknessEngine } from './analyticsService.js';
import Revision from '../models/Revision.js';
import UserExam from '../models/UserExam.js';
import Subject from '../models/Subject.js';
import StudySession from '../models/StudySession.js';

/**
 * Deterministic Recommendation Engine Service
 *
 * Computes topic study priority without an LLM based on 7 factors:
 * 1. Weakness (100 - masteryScore)
 * 2. Revision Due (status & days overdue)
 * 3. Exam Priority (target exam deadline & subject weightage)
 * 4. Performance Trend (recent 30d vs baseline accuracy delta)
 * 5. Syllabus Priority (In Progress, Not Started, Completed, Revised)
 * 6. Recency / Inactivity Decay (days since last attempt/revision/session)
 * 7. Available Time Fit (matching candidate activity to available study window)
 */
export const getTopicRecommendations = async (userId, filters = {}) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const availableTime = Math.max(15, parseInt(filters.availableTime, 10) || 60);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 10));
  const minPriority = Math.max(0, parseFloat(filters.minPriority) || 0);

  // 1. Fetch Weak-Topic analytics baseline
  const topicAnalyticsRes = await getTopicAnalyticsWithWeaknessEngine(userId, filters);
  const topicList = topicAnalyticsRes.topics || [];

  if (!topicList.length) {
    return {
      meta: {
        totalRecommendations: 0,
        availableTimeMinutes: availableTime,
        generatedAt: new Date().toISOString(),
        formula: 'P_score = 0.25*Weakness + 0.20*Revision + 0.15*Exam + 0.15*Trend + 0.10*Syllabus + 0.10*Recency + 0.05*TimeFit',
      },
      recommendations: [],
    };
  }

  const topicIds = topicList.map((t) => new mongoose.Types.ObjectId(t.topicId));

  // 2. Fetch UserExams for target date calculation
  const userExams = await UserExam.find({ userId: userObjId, status: 'active' }).populate('examId').lean();
  const userExamMap = new Map();
  userExams.forEach((ue) => {
    if (ue.examId?._id) {
      userExamMap.set(ue.examId._id.toString(), ue);
    }
  });

  // 3. Fetch Revisions for revision status & overdue days
  const revisions = await Revision.find({ userId: userObjId, topicId: { $in: topicIds } }).lean();
  const revisionMap = new Map();
  revisions.forEach((r) => {
    revisionMap.set(r.topicId.toString(), r);
  });

  // 4. Fetch Subjects for weightage calculation
  const subjectIds = [...new Set(topicList.map((t) => t.subjectId?.toString()).filter(Boolean))];
  const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
  const subjectMap = new Map();
  subjects.forEach((s) => {
    subjectMap.set(s._id.toString(), s);
  });

  // 5. Fetch recent StudySessions to compute recency per topic
  const studySessions = await StudySession.aggregate([
    { $match: { userId: userObjId, topicId: { $in: topicIds } } },
    { $group: { _id: '$topicId', lastSessionDate: { $max: '$date' } } },
  ]);
  const sessionMap = new Map();
  studySessions.forEach((ss) => {
    sessionMap.set(ss._id.toString(), ss.lastSessionDate);
  });

  const now = new Date();

  // 6. Calculate priority score for each topic
  const recommendations = topicList.map((t) => {
    const topicIdStr = t.topicId.toString();
    const subjectIdStr = t.subjectId ? t.subjectId.toString() : null;
    const examIdStr = t.examId ? t.examId.toString() : null;

    // --- Factor 1: Weakness Factor (F_weakness) ---
    const masteryScore = typeof t.masteryScore === 'number' ? t.masteryScore : 0;
    const weaknessFactor = Math.min(100, Math.max(0, 100 - masteryScore));

    // --- Factor 2: Revision Due Factor (F_revision) ---
    const revisionRecord = revisionMap.get(topicIdStr);
    let revisionStatus = 'NONE';
    let daysOverdue = 0;
    let revisionFactor = 20;

    if (revisionRecord) {
      const nextRevDate = revisionRecord.nextRevisionDate || revisionRecord.nextReviewDate;
      if (nextRevDate) {
        const diffMs = now.getTime() - new Date(nextRevDate).getTime();
        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (daysOverdue > 0) {
          revisionStatus = 'OVERDUE';
          revisionFactor = Math.min(100, 70 + daysOverdue * 3);
        } else if (daysOverdue === 0 || (daysOverdue >= -1 && daysOverdue <= 0)) {
          revisionStatus = 'DUE';
          revisionFactor = 65;
        } else {
          revisionStatus = 'PENDING';
          const daysUntil = Math.abs(daysOverdue);
          revisionFactor = Math.max(0, 40 - daysUntil * 2);
        }
      }
    } else {
      if (t.syllabusStatus === 'Completed' || t.syllabusStatus === 'Revised') {
        revisionFactor = 50;
      } else {
        revisionFactor = 20;
      }
    }

    // --- Factor 3: Exam Priority Factor (F_exam) ---
    const userExam = userExamMap.get(examIdStr);
    let daysToExam = null;
    let urgencyWeight = 40;

    if (userExam && userExam.targetDate) {
      const diffMs = new Date(userExam.targetDate).getTime() - now.getTime();
      daysToExam = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (daysToExam <= 14) urgencyWeight = 100;
      else if (daysToExam <= 30) urgencyWeight = 85;
      else if (daysToExam <= 60) urgencyWeight = 70;
      else if (daysToExam <= 90) urgencyWeight = 55;
      else urgencyWeight = 40;
    }

    const subjectObj = subjectMap.get(subjectIdStr);
    const subjectWeightage = subjectObj && typeof subjectObj.weightage === 'number' ? subjectObj.weightage : 33.3;
    const examFactor = Math.min(100, Math.round(0.7 * urgencyWeight + 0.3 * Math.min(100, subjectWeightage * 3)));

    // --- Factor 4: Performance Trend Factor (F_trend) ---
    const recentAcc = t.recentAccuracy !== undefined ? t.recentAccuracy : t.accuracy;
    const overallAcc = t.pyqAccuracy || t.accuracy || 0;
    const performanceTrendDelta = t.totalAttempts > 0 ? Math.round((recentAcc - overallAcc) * 10) / 10 : 0;

    let trendFactor = 50;
    if (performanceTrendDelta <= -20) trendFactor = 90;
    else if (performanceTrendDelta < 0) trendFactor = 70;
    else if (performanceTrendDelta === 0) trendFactor = 50;
    else trendFactor = 30;

    // --- Factor 5: Syllabus Priority Factor (F_syllabus) ---
    let syllabusFactor = 70;
    if (t.syllabusStatus === 'In Progress') syllabusFactor = 85;
    else if (t.syllabusStatus === 'Not Started') syllabusFactor = 70;
    else if (t.syllabusStatus === 'Completed') syllabusFactor = 40;
    else if (t.syllabusStatus === 'Revised') syllabusFactor = 25;

    // --- Factor 6: Recency / Inactivity Decay Factor (F_recency) ---
    const lastSessionDate = sessionMap.get(topicIdStr);
    const lastRevisedAt = t.lastRevisedAt;

    let latestActivityDate = null;
    if (lastSessionDate) latestActivityDate = new Date(lastSessionDate);
    if (lastRevisedAt && (!latestActivityDate || new Date(lastRevisedAt) > latestActivityDate)) {
      latestActivityDate = new Date(lastRevisedAt);
    }

    let daysSinceLastActivity = null;
    let recencyFactor = 50;
    if (latestActivityDate) {
      daysSinceLastActivity = Math.max(0, Math.floor((now.getTime() - latestActivityDate.getTime()) / (1000 * 60 * 60 * 24)));
      if (daysSinceLastActivity > 30) recencyFactor = 90;
      else if (daysSinceLastActivity > 14) recencyFactor = 70;
      else if (daysSinceLastActivity > 7) recencyFactor = 50;
      else recencyFactor = 20;
    } else {
      if (t.totalAttempts > 0) recencyFactor = 70;
      else recencyFactor = 50;
    }

    // --- Factor 7: Available Time Fit Factor (F_time) ---
    let timeFitFactor = 80;
    if (availableTime >= 60) timeFitFactor = 90;
    else if (availableTime >= 30) timeFitFactor = 80;
    else timeFitFactor = 75;

    // --- Composite Priority Score Calculation ---
    const rawPriorityScore =
      0.25 * weaknessFactor +
      0.20 * revisionFactor +
      0.15 * examFactor +
      0.15 * trendFactor +
      0.10 * syllabusFactor +
      0.10 * recencyFactor +
      0.05 * timeFitFactor;

    const priorityScore = Math.min(100, Math.max(0, Math.round(rawPriorityScore * 10) / 10));

    // Priority Level Classification
    let priorityLevel = 'LOW';
    if (priorityScore >= 75) priorityLevel = 'CRITICAL';
    else if (priorityScore >= 60) priorityLevel = 'HIGH';
    else if (priorityScore >= 45) priorityLevel = 'MEDIUM';

    // --- Reason Codes & Explainability Sentences ---
    const reasonCodes = [];
    const reasons = [];

    if (t.classification === 'WEAK' || t.accuracy < 50 || weaknessFactor >= 50) {
      reasonCodes.push('WEAK_TOPIC_ACCURACY_LOW');
      reasons.push(`Topic mastery is ${t.masteryScore}% (${t.classification} classification) with ${t.accuracy}% accuracy.`);
    }

    if (revisionStatus === 'OVERDUE') {
      reasonCodes.push('REVISION_OVERDUE');
      reasons.push(`Revision is overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}.`);
    } else if (revisionStatus === 'DUE') {
      reasonCodes.push('REVISION_DUE_TODAY');
      reasons.push('Revision is scheduled for today.');
    }

    if (daysToExam !== null && daysToExam <= 30) {
      reasonCodes.push('EXAM_APPROACHING');
      reasons.push(`Target exam is in ${daysToExam} day${daysToExam === 1 ? '' : 's'}.`);
    }

    if (performanceTrendDelta <= -15) {
      reasonCodes.push('PERFORMANCE_DECLINING');
      reasons.push(`Recent accuracy dropped by ${Math.abs(performanceTrendDelta)}% compared to baseline.`);
    }

    if (t.syllabusStatus === 'In Progress' || t.syllabusStatus === 'Not Started') {
      reasonCodes.push('SYLLABUS_INCOMPLETE');
      reasons.push(`Syllabus coverage status is "${t.syllabusStatus}".`);
    }

    if (daysSinceLastActivity !== null && daysSinceLastActivity > 21) {
      reasonCodes.push('HIGH_INACTIVITY_DECAY');
      reasons.push(`No practice or revision recorded for ${daysSinceLastActivity} days.`);
    }

    if (availableTime > 0) {
      reasonCodes.push('TIME_FIT_OPTIMAL');
      reasons.push(`Recommended activity fits into your ${availableTime}-minute available study window.`);
    }

    if (!reasons.length) {
      reasons.push(`Topic performance is ${t.masteryScore}% with status "${t.syllabusStatus}".`);
    }

    // --- Recommended Action Generation ---
    let actionType = 'PRACTICE_PYQS';
    let actionTitle = '';
    let actionDescription = '';
    let estimatedMinutes = Math.min(availableTime, 45);

    if (revisionStatus === 'OVERDUE' || revisionStatus === 'DUE') {
      actionType = 'REVISE_CONCEPTS';
      actionTitle = `Revise ${t.topicName} Concepts`;
      actionDescription = `Complete spaced revision for ${t.topicName} to arrest memory decay.`;
      estimatedMinutes = Math.min(availableTime, 30);
    } else if (t.classification === 'WEAK' || t.accuracy < 50) {
      actionType = 'PRACTICE_PYQS';
      actionTitle = `Practice PYQs on ${t.topicName}`;
      actionDescription = `Solve past year questions on ${t.topicName} to improve accuracy from ${t.accuracy}%.`;
      estimatedMinutes = Math.min(availableTime, 45);
    } else if (t.syllabusStatus === 'Not Started' || t.syllabusStatus === 'In Progress') {
      actionType = 'COMPLETE_STUDY';
      actionTitle = `Study ${t.topicName}`;
      actionDescription = `Cover core theoretical concepts and foundational problems for ${t.topicName}.`;
      estimatedMinutes = Math.min(availableTime, 60);
    } else {
      actionType = 'TAKE_MOCK_QUIZ';
      actionTitle = `Take Quick Quiz on ${t.topicName}`;
      actionDescription = `Test retention with a short timed quiz on ${t.topicName}.`;
      estimatedMinutes = Math.min(availableTime, 30);
    }

    return {
      topic: {
        id: t.topicId,
        name: t.topicName,
        subjectId: t.subjectId,
        subjectName: t.subjectName,
        examId: t.examId,
        examName: t.examName,
      },
      priority: {
        score: priorityScore,
        level: priorityLevel,
        breakdown: {
          weaknessFactor: Math.round(weaknessFactor * 10) / 10,
          revisionFactor: Math.round(revisionFactor * 10) / 10,
          examFactor: Math.round(examFactor * 10) / 10,
          trendFactor: Math.round(trendFactor * 10) / 10,
          syllabusFactor: Math.round(syllabusFactor * 10) / 10,
          recencyFactor: Math.round(recencyFactor * 10) / 10,
          timeFitFactor: Math.round(timeFitFactor * 10) / 10,
        },
      },
      recommendedAction: {
        actionType,
        title: actionTitle,
        description: actionDescription,
        estimatedMinutes,
      },
      reasonCodes,
      reasons,
      supportingMetrics: {
        weaknessScore: Math.round(weaknessFactor * 10) / 10,
        masteryScore: t.masteryScore,
        accuracy: t.accuracy,
        totalAttempts: t.totalAttempts,
        revisionStatus,
        daysOverdue,
        daysSinceLastActivity,
        performanceTrendDelta,
        syllabusStatus: t.syllabusStatus,
        daysToExam,
        subjectWeightage,
      },
    };
  });

  // Filter by minPriority threshold and sort descending by priority score
  const filtered = recommendations
    .filter((r) => r.priority.score >= minPriority)
    .sort((a, b) => b.priority.score - a.priority.score);

  const finalRecommendations = filtered.slice(0, limit);

  return {
    meta: {
      totalRecommendations: finalRecommendations.length,
      availableTimeMinutes: availableTime,
      generatedAt: now.toISOString(),
      formula: 'P_score = 0.25*Weakness + 0.20*Revision + 0.15*Exam + 0.15*Trend + 0.10*Syllabus + 0.10*Recency + 0.05*TimeFit',
    },
    recommendations: finalRecommendations,
  };
};
