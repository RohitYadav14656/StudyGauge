import axios from 'axios';

export interface AnalyticsFilterParams {
  dateRange?: string;
  examId?: string;
  subjectId?: string;
  classification?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const analyticsService = {
  getOverview: async (filters: AnalyticsFilterParams = {}) => {
    const response = await axios.get('/api/analytics/overview', {
      params: filters,
      ...getHeaders(),
    });
    return response.data;
  },

  getSubjects: async (filters: AnalyticsFilterParams = {}) => {
    const response = await axios.get('/api/analytics/subjects', {
      params: filters,
      ...getHeaders(),
    });
    return response.data;
  },

  getTopics: async (filters: AnalyticsFilterParams = {}) => {
    const response = await axios.get('/api/analytics/topics', {
      params: filters,
      ...getHeaders(),
    });
    return response.data;
  },

  getTests: async (filters: AnalyticsFilterParams = {}) => {
    const response = await axios.get('/api/analytics/tests', {
      params: filters,
      ...getHeaders(),
    });
    return response.data;
  },

  getStudy: async (filters: AnalyticsFilterParams = {}) => {
    const response = await axios.get('/api/analytics/study', {
      params: filters,
      ...getHeaders(),
    });
    return response.data;
  },
};
