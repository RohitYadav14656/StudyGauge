import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import UserTopicProgress from '../models/UserTopicProgress.js';

export const calculateExamAnalytics = async (userId, examId) => {

  const subjects = await Subject.find({ examId, active: true }).lean();
  const topics = await Topic.find({ examId, active: true }).lean();

  const progressRecords = await UserTopicProgress.find({ userId, examId }).lean();

  const progressMap = {};
  progressRecords.forEach(record => {
    progressMap[record.topicId.toString()] = record.status;
  });

  let totalTopics = 0;
  let completedTopics = 0;
  let pendingTopics = 0;
  let revisedTopics = 0;
  let notStartedTopics = 0;
  let inProgressTopics = 0;

  const subjectAnalyticsMap = {};
  subjects.forEach(subject => {
    subjectAnalyticsMap[subject._id.toString()] = {
      subjectId: subject._id,
      name: subject.name,
      totalTopics: 0,
      completedTopics: 0,
      completionPercentage: 0,
    };
  });

  topics.forEach(topic => {
    totalTopics++;
    const subjectId = topic.subjectId.toString();
    const status = progressMap[topic._id.toString()] || 'Not Started';

    if (subjectAnalyticsMap[subjectId]) {
      subjectAnalyticsMap[subjectId].totalTopics++;
    }

    if (status === 'Completed' || status === 'Revised') {
      completedTopics++;
      if (subjectAnalyticsMap[subjectId]) {
        subjectAnalyticsMap[subjectId].completedTopics++;
      }
      if (status === 'Revised') revisedTopics++;
    } else {
      pendingTopics++;
      if (status === 'Not Started') notStartedTopics++;
      if (status === 'In Progress') inProgressTopics++;
    }
  });

  const overallCompletionPercentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

  const subjectAnalytics = Object.values(subjectAnalyticsMap).map(subject => {
    const percentage = subject.totalTopics === 0 ? 0 : Math.round((subject.completedTopics / subject.totalTopics) * 100);
    return {
      ...subject,
      completionPercentage: percentage,
    };
  });

  return {
    overall: {
      totalTopics,
      completedTopics,
      pendingTopics,
      revisedTopics,
      notStartedTopics,
      inProgressTopics,
      completionPercentage: overallCompletionPercentage,
    },
    subjects: subjectAnalytics,
  };
};
