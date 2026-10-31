import axios from 'axios';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export interface StudyPlanItemData {
  _id?: string;
  studyPlanId?: string;
  examId: string;
  topicId?: string;
  subjectId?: string;
  title: string;
  date: string;
  plannedDuration: number;
  actualDuration: number;
  activityType: 'reading' | 'revision' | 'practice' | 'mock_test' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'planned' | 'in_progress' | 'completed' | 'partially_completed' | 'missed' | 'rescheduled';
  completion: number;
  notes?: string;
  topicId_data?: any;
  subjectId_data?: any;
}

export interface StudyPlanData {
  _id?: string;
  examId: string;
  title: string;
  startDate: string;
  endDate: string;
  status?: string;
  notes?: string;
}

export const studyPlanService = {
  getPlans: async () => {
    const res = await axios.get('/api/study-plans', getHeaders());
    return res.data;
  },

  getPlanById: async (id: string) => {
    const res = await axios.get(`/api/study-plans/${id}`, getHeaders());
    return res.data;
  },

  createPlan: async (data: Partial<StudyPlanData>) => {
    const res = await axios.post('/api/study-plans', data, getHeaders());
    return res.data;
  },

  generatePlan: async (data: { examId: string, title: string, startDate: string, endDate: string, dailyStudyHours: number, preparationLevel: string }) => {
    const res = await axios.post('/api/study-plans/generate', data, getHeaders());
    return res.data;
  },

  getPlanItems: async (planId: string, startDate?: string, endDate?: string) => {
    let url = `/api/study-plans/${planId}/items`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await axios.get(url, getHeaders());
    return res.data;
  },

  createPlanItem: async (planId: string, data: Partial<StudyPlanItemData>) => {
    const res = await axios.post(`/api/study-plans/${planId}/items`, data, getHeaders());
    return res.data;
  },

  updatePlanItem: async (itemId: string, data: Partial<StudyPlanItemData>) => {
    const res = await axios.put(`/api/study-plans/items/${itemId}`, data, getHeaders());
    return res.data;
  },

  deletePlanItem: async (itemId: string) => {
    const res = await axios.delete(`/api/study-plans/items/${itemId}`, getHeaders());
    return res.data;
  },

  analyzeAdaptation: async (planId: string) => {
    const res = await axios.get(`/api/study-plans/${planId}/adapt/analysis`, getHeaders());
    return res.data;
  },

  adaptPlan: async (planId: string, options?: { maxDailyHours?: number; prioritizeWeakTopics?: boolean }) => {
    const res = await axios.post(`/api/study-plans/${planId}/adapt`, options || {}, getHeaders());
    return res.data;
  }
};
