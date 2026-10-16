import mongoose from 'mongoose';

// Test mock values for each of the 7 factors
function calculatePriorityScore({
  masteryScore,
  revisionStatus,
  daysOverdue,
  daysToExam,
  subjectWeightage,
  recentAccuracy,
  overallAccuracy,
  totalAttempts,
  syllabusStatus,
  daysSinceLastActivity,
  availableTime = 60,
}) {
  // 1. Weakness Factor
  const weaknessFactor = Math.min(100, Math.max(0, 100 - masteryScore));

  // 2. Revision Factor
  let revisionFactor = 20;
  if (revisionStatus === 'OVERDUE') {
    revisionFactor = Math.min(100, 70 + daysOverdue * 3);
  } else if (revisionStatus === 'DUE') {
    revisionFactor = 65;
  } else if (revisionStatus === 'PENDING') {
    revisionFactor = Math.max(0, 40 - Math.abs(daysOverdue) * 2);
  } else {
    revisionFactor = (syllabusStatus === 'Completed' || syllabusStatus === 'Revised') ? 50 : 20;
  }

  // 3. Exam Factor
  let urgencyWeight = 40;
  if (daysToExam !== null && daysToExam !== undefined) {
    if (daysToExam <= 14) urgencyWeight = 100;
    else if (daysToExam <= 30) urgencyWeight = 85;
    else if (daysToExam <= 60) urgencyWeight = 70;
    else if (daysToExam <= 90) urgencyWeight = 55;
    else urgencyWeight = 40;
  }
  const examFactor = Math.min(100, Math.round(0.7 * urgencyWeight + 0.3 * Math.min(100, (subjectWeightage || 33.3) * 3)));

  // 4. Performance Trend Factor
  const performanceTrendDelta = totalAttempts > 0 ? Math.round((recentAccuracy - overallAccuracy) * 10) / 10 : 0;
  let trendFactor = 50;
  if (performanceTrendDelta <= -20) trendFactor = 90;
  else if (performanceTrendDelta < 0) trendFactor = 70;
  else if (performanceTrendDelta === 0) trendFactor = 50;
  else trendFactor = 30;

  // 5. Syllabus Factor
  let syllabusFactor = 70;
  if (syllabusStatus === 'In Progress') syllabusFactor = 85;
  else if (syllabusStatus === 'Not Started') syllabusFactor = 70;
  else if (syllabusStatus === 'Completed') syllabusFactor = 40;
  else if (syllabusStatus === 'Revised') syllabusFactor = 25;

  // 6. Recency Factor
  let recencyFactor = 50;
  if (daysSinceLastActivity !== null && daysSinceLastActivity !== undefined) {
    if (daysSinceLastActivity > 30) recencyFactor = 90;
    else if (daysSinceLastActivity > 14) recencyFactor = 70;
    else if (daysSinceLastActivity > 7) recencyFactor = 50;
    else recencyFactor = 20;
  }

  // 7. Available Time Fit
  let timeFitFactor = 80;
  if (availableTime >= 60) timeFitFactor = 90;
  else if (availableTime >= 30) timeFitFactor = 80;
  else timeFitFactor = 75;

  // Composite Formula
  const rawPriorityScore = (
    0.25 * weaknessFactor +
    0.20 * revisionFactor +
    0.15 * examFactor +
    0.15 * trendFactor +
    0.10 * syllabusFactor +
    0.10 * recencyFactor +
    0.05 * timeFitFactor
  );

  const priorityScore = Math.min(100, Math.max(0, Math.round(rawPriorityScore * 10) / 10));

  let priorityLevel = 'LOW';
  if (priorityScore >= 75) priorityLevel = 'CRITICAL';
  else if (priorityScore >= 60) priorityLevel = 'HIGH';
  else if (priorityScore >= 45) priorityLevel = 'MEDIUM';

  return {
    priorityScore,
    priorityLevel,
    breakdown: { weaknessFactor, revisionFactor, examFactor, trendFactor, syllabusFactor, recencyFactor, timeFitFactor },
  };
}

console.log('--- TESTING 7-FACTOR RECOMMENDATION FORMULA ---');

// Test Case 1: High Weakness + Overdue Revision + Approaching Exam
const test1 = calculatePriorityScore({
  masteryScore: 25,
  revisionStatus: 'OVERDUE',
  daysOverdue: 5,
  daysToExam: 10,
  subjectWeightage: 35,
  recentAccuracy: 20,
  overallAccuracy: 40,
  totalAttempts: 12,
  syllabusStatus: 'In Progress',
  daysSinceLastActivity: 25,
  availableTime: 60,
});

console.log('Test Case 1 (Weak + Overdue + Approaching Exam):', test1);
if (test1.priorityScore < 75 || test1.priorityLevel !== 'CRITICAL') {
  console.error('FAILED Test Case 1');
  process.exit(1);
}

// Test Case 2: Strong Topic + Up to Date Revision
const test2 = calculatePriorityScore({
  masteryScore: 90,
  revisionStatus: 'PENDING',
  daysOverdue: -10,
  daysToExam: 60,
  subjectWeightage: 20,
  recentAccuracy: 95,
  overallAccuracy: 90,
  totalAttempts: 20,
  syllabusStatus: 'Revised',
  daysSinceLastActivity: 3,
  availableTime: 30,
});

console.log('Test Case 2 (Strong + Up-to-Date):', test2);
if (test2.priorityScore >= 60) {
  console.error('FAILED Test Case 2: Expected lower priority score for strong topic');
  process.exit(1);
}

console.log('✅ ALL 7-FACTOR DETERMINISTIC FORMULA UNIT TESTS PASSED!');
