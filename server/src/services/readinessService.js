import mongoose from 'mongoose';
import {
  getSyllabusCompletion,
  getTopicAnalyticsWithWeaknessEngine,
  getMockTestPerformance,
  getPYQAccuracy,
  getConsistencyMetrics,
} from './analyticsService.js';
import Revision from '../models/Revision.js';

export const FACTOR_DEFINITIONS = {
  syllabusCompletion: { name: 'Syllabus Completion', defaultWeight: 0.20 },
  topicMastery: { name: 'Topic Mastery', defaultWeight: 0.20 },
  mockPerformance: { name: 'Mock Performance', defaultWeight: 0.20 },
  accuracy: { name: 'Practice Accuracy', defaultWeight: 0.15 },
  revisionConsistency: { name: 'Revision Consistency', defaultWeight: 0.10 },
  studyConsistency: { name: 'Study Consistency', defaultWeight: 0.10 },
  pyqPerformance: { name: 'PYQ Performance', defaultWeight: 0.05 },
};

export const calculateReadinessScore = (inputs = {}) => {
  const componentScores = {};
  const missingFactors = [];
  const availableFactors = [];

  let totalAvailableWeight = 0;

  for (const [factorKey, def] of Object.entries(FACTOR_DEFINITIONS)) {
    const rawVal = inputs[factorKey];
    const isAvailable = typeof rawVal === 'number' && !isNaN(rawVal);

    if (isAvailable) {

      const score = Math.min(100, Math.max(0, Math.round(rawVal * 10) / 10));

      availableFactors.push({
        key: factorKey,
        label: def.name,
        score,
        defaultWeight: def.defaultWeight,
      });
      totalAvailableWeight += def.defaultWeight;
    } else {
      missingFactors.push(factorKey);
      componentScores[factorKey] = {
        score: null,
        defaultWeight: def.defaultWeight,
        normalizedWeight: 0,
        status: 'missing',
        label: def.name,
        rawValue: null,
        note: `No ${def.name.toLowerCase()} data recorded. Weight redistributed.`,
      };
    }
  }

  if (availableFactors.length === 0 || totalAvailableWeight === 0) {
    return {
      overallScore: 0,
      confidenceLevel: 'NONE',
      componentScores,
      explanationMetadata: {
        formula: 'Weighted average of available factors (normalized to 100%)',
        totalFactors: Object.keys(FACTOR_DEFINITIONS).length,
        availableFactorsCount: 0,
        missingFactors,
        weightAdjustments: {},
        insights: ['No activity recorded yet. Start studying topics and taking tests to calculate readiness score.'],
      },
    };
  }

  let overallScoreRaw = 0;
  const weightAdjustments = {};

  for (const factor of availableFactors) {
    const normalizedWeight = factor.defaultWeight / totalAvailableWeight;
    const weightedContribution = factor.score * normalizedWeight;

    overallScoreRaw += weightedContribution;
    weightAdjustments[factor.key] = Math.round(normalizedWeight * 10000) / 10000;

    componentScores[factor.key] = {
      score: factor.score,
      defaultWeight: factor.defaultWeight,
      normalizedWeight: Math.round(normalizedWeight * 1000) / 1000,
      status: 'available',
      label: factor.label,
      rawValue: factor.score,
    };
  }

  const overallScore = Math.min(100, Math.max(0, Math.round(overallScoreRaw * 10) / 10));

  let confidenceLevel = 'LOW';
  if (availableFactors.length >= 5) {
    confidenceLevel = 'HIGH';
  } else if (availableFactors.length >= 3) {
    confidenceLevel = 'MEDIUM';
  }

  const insights = [];
  const sortedAvailable = [...availableFactors].sort((a, b) => b.score - a.score);

  if (sortedAvailable.length > 0) {
    const topFactor = sortedAvailable[0];
    insights.push(`Strong performance in ${topFactor.label} (${topFactor.score}%).`);

    const lowestFactor = sortedAvailable[sortedAvailable.length - 1];
    if (lowestFactor.score < 70) {
      insights.push(`Focus on improving ${lowestFactor.label} (${lowestFactor.score}%) to boost overall exam readiness.`);
    }
  }

  if (missingFactors.length > 0) {
    insights.push(
      `Complete missing activities (${missingFactors.map((k) => FACTOR_DEFINITIONS[k].name).join(', ')}) for higher accuracy.`
    );
  }

  return {
    overallScore,
    confidenceLevel,
    componentScores,
    explanationMetadata: {
      formula: 'Weighted sum of available normalized factors',
      totalFactors: Object.keys(FACTOR_DEFINITIONS).length,
      availableFactorsCount: availableFactors.length,
      missingFactors,
      weightAdjustments,
      insights,
    },
  };
};

export const getUserReadinessData = async (userId, targetExamId) => {
  const filters = { examId: targetExamId };

  const [syllabusRes, topicAnalytics, mockPerf, pyqRes, consistencyRes, userRevisions] =
    await Promise.all([
      getSyllabusCompletion(userId, targetExamId).catch(() => null),
      getTopicAnalyticsWithWeaknessEngine(userId, filters).catch(() => null),
      getMockTestPerformance(userId, filters).catch(() => null),
      getPYQAccuracy(userId, filters).catch(() => null),
      getConsistencyMetrics(userId, 30, filters).catch(() => null),
      Revision.find({ userId }).lean().catch(() => []),
    ]);

  const syllabusCompletion =
    syllabusRes && typeof syllabusRes.completionPercentage === 'number'
      ? syllabusRes.completionPercentage
      : null;

  let topicMastery = null;
  let accuracy = null;
  if (topicAnalytics?.topics?.length > 0) {
    const sumMastery = topicAnalytics.topics.reduce((acc, t) => acc + (t.masteryScore || 0), 0);
    topicMastery = Math.round((sumMastery / topicAnalytics.topics.length) * 10) / 10;

    const totalAttempts = topicAnalytics.topics.reduce((acc, t) => acc + (t.totalAttempts || 0), 0);
    const totalCorrect = topicAnalytics.topics.reduce(
      (acc, t) => acc + ((t.pyqCorrect || 0) + (t.mockCorrect || 0)),
      0
    );
    if (totalAttempts > 0) {
      accuracy = Math.round((totalCorrect / totalAttempts) * 1000) / 10;
    }
  }

  let mockPerformance = null;
  if (mockPerf?.summary?.totalTests > 0 && typeof mockPerf.summary.averageScorePercentage === 'number') {
    mockPerformance = mockPerf.summary.averageScorePercentage;
  }

  let pyqPerformance = null;
  if (pyqRes?.overall?.attempted > 0 && typeof pyqRes.overall.accuracy === 'number') {
    pyqPerformance = pyqRes.overall.accuracy;
  }

  let studyConsistency = null;
  if (consistencyRes && typeof consistencyRes.activeDays === 'number') {
    studyConsistency = Math.min(100, Math.round((consistencyRes.activeDays / 30) * 100));
  }

  let revisionConsistency = null;
  if (userRevisions.length > 0) {
    const completedOrPending = userRevisions.filter((r) => r.status === 'COMPLETED' || r.status === 'PENDING').length;
    revisionConsistency = Math.round((completedOrPending / userRevisions.length) * 100);
  }

  const inputs = {
    syllabusCompletion,
    topicMastery,
    mockPerformance,
    accuracy,
    revisionConsistency,
    studyConsistency,
    pyqPerformance,
  };

  return calculateReadinessScore(inputs);
};
