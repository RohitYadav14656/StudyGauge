import axios from 'axios';

export interface GoalData {
  _id?: string;
  title: string;
  period: 'daily' | 'weekly' | 'monthly' | 'long-term';
  metric: 'study_hours' | 'topics_completed' | 'pyqs_attempted' | 'mock_tests_completed';
  targetValue: number;
  currentValue?: number;
  startDate: string;
  endDate: string;
  status?: 'in-progress' | 'achieved' | 'abandoned' | 'failed';
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const goalService = {
  create: async (data: GoalData) => {
    const response = await axios.post('/api/goals', data, getHeaders());
    return response.data;
  },

  getAll: async () => {
    const response = await axios.get('/api/goals', getHeaders());
    return response.data;
  },

  update: async (id: string, data: Partial<GoalData>) => {
    const response = await axios.put(`/api/goals/${id}`, data, getHeaders());
    return response.data;
  }
};
