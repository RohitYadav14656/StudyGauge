import axios from 'axios';

export interface ExamCountdown {
  examName: string | null;
  targetDate: string | null;
  daysLeft: number | null;
  hasActiveExam: boolean;
}

export interface ReadinessData {
  overallScore: number;
  confidenceLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  componentScores: Record<string, any>;
  explanationMetadata: {
    insights: string[];
    [key: string]: any;
  };
}

export interface StudyTimeData {
  todayHours: number;
  weeklyHours: number;
  monthlyHours: number;
  dailyMinutes: number;
  weeklyMinutes: number;
}

export interface ConsistencyData {
  currentStreak: number;
  currentStreakDays: number;
  longestStreak: number;
  consistencyPercentage: number;
  activeDays: number;
  totalDays: number;
}

export interface SyllabusProgressData {
  completionPercentage: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  totalTopics: number;
}

export interface SubjectPerfItem {
  _id: string;
  subjectName: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
}

export interface WeakTopicItem {
  topicId: string;
  topicName: string;
  subjectName: string;
  masteryScore: number;
  classification: 'WEAK' | 'MODERATE' | 'STRONG';
  totalAttempts: number;
  accuracy: number;
  reason: string;
}

export interface RevisionDueItem {
  _id: string;
  topicName: string;
  subjectName: string | null;
  status: string;
  nextRevisionDate: string;
  revisionCount: number;
}

export interface GoalProgressItem {
  _id: string;
  title: string;
  period: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface TodayPlanItem {
  _id: string;
  title: string;
  topicName: string | null;
  subjectName: string | null;
  activityType: string;
  priority: string;
  status: string;
  plannedDuration: number;
  actualDuration: number;
  completion: number;
}

export interface RecommendationItem {
  topic: {
    id: string;
    name: string;
    subjectName: string;
  };
  priority: {
    score: number;
    level: string;
  };
  recommendedAction: {
    actionType: string;
    title: string;
    description: string;
    estimatedMinutes: number;
  };
  reasonCodes: string[];
  reasons: string[];
}

export interface RecentActivityItem {
  _id: string;
  studyType: string;
  subjectName: string | null;
  topicName: string | null;
  durationMinutes: number;
  date: string;
}

export interface MockTrendItem {
  week: string;
  avgScore: number;
  avgPercentage: number;
  testCount: number;
}

export interface MockPerformanceSummary {
  totalTests: number;
  avgScorePercentage: number;
  bestScorePercentage: number;
}

export interface DashboardData {
  examCountdown: ExamCountdown;
  readiness: ReadinessData;
  studyTime: StudyTimeData;
  consistency: ConsistencyData;
  syllabusProgress: SyllabusProgressData;
  subjectPerformance: { subjects: SubjectPerfItem[] };
  weakTopics: {
    summary: { totalTopics: number; weakTopics: number; moderateTopics: number; strongTopics: number };
    topics: WeakTopicItem[];
  };
  revisionDue: {
    dueTodayCount: number;
    overdueCount: number;
    totalDue: number;
    revisions: RevisionDueItem[];
  };
  goalProgress: GoalProgressItem[];
  todaysPlan: TodayPlanItem[];
  recommendations: {
    meta: { totalRecommendations: number };
    recommendations: RecommendationItem[];
  };
  recentActivity: RecentActivityItem[];
  mockTrend: MockTrendItem[];
  mockPerformance: MockPerformanceSummary;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const dashboardService = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response = await axios.get('/api/dashboard', getHeaders());
    return response.data;
  },
};
