import axios from './axiosInstance';

export interface RecommendationFilterParams {
  examId?: string;
  subjectId?: string;
  availableTime?: number;
  limit?: number;
  minPriority?: number;
}

export interface RecommendationItem {
  topic: {
    id: string;
    name: string;
    subjectId: string;
    subjectName: string;
    examId: string;
    examName: string;
  };
  priority: {
    score: number;
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    breakdown: {
      weaknessFactor: number;
      revisionFactor: number;
      examFactor: number;
      trendFactor: number;
      syllabusFactor: number;
      recencyFactor: number;
      timeFitFactor: number;
    };
  };
  recommendedAction: {
    actionType: 'PRACTICE_PYQS' | 'REVISE_CONCEPTS' | 'COMPLETE_STUDY' | 'TAKE_MOCK_QUIZ';
    title: string;
    description: string;
    estimatedMinutes: number;
  };
  reasonCodes: string[];
  reasons: string[];
  supportingMetrics: {
    weaknessScore: number;
    masteryScore: number;
    accuracy: number;
    totalAttempts: number;
    revisionStatus: string;
    daysOverdue: number;
    daysSinceLastActivity: number | null;
    performanceTrendDelta: number;
    syllabusStatus: string;
    daysToExam: number | null;
    subjectWeightage: number;
  };
}

export interface RecommendationResponse {
  success: boolean;
  data: {
    meta: {
      totalRecommendations: number;
      availableTimeMinutes: number;
      generatedAt: string;
      formula: string;
    };
    recommendations: RecommendationItem[];
  };
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const recommendationService = {
  getRecommendations: async (filters: RecommendationFilterParams = {}): Promise<RecommendationResponse> => {
    const response = await axios.get('/api/recommendations', {
      params: filters,
      ...getHeaders(),
    });
    return response.data;
  },
};
