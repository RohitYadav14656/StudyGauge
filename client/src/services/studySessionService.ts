import axios from './axiosInstance';

export interface StudySessionData {
  _id?: string;
  examId?: string;
  subjectId?: string;
  topicId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  studyType: 'Lecture' | 'Reading' | 'Practice' | 'PYQ' | 'Mock Test' | 'Revision';
  notes?: string;
  timerEvents?: Array<{
    type: 'start' | 'pause' | 'resume' | 'stop';
    time: string;
  }>;
}

export interface StudySessionFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  topicId?: string;
  examId?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const studySessionService = {
  create: async (data: StudySessionData) => {
    const response = await axios.post('/api/study-sessions', data, getHeaders());
    return response.data;
  },

  getAll: async (filters?: StudySessionFilters) => {
    const response = await axios.get('/api/study-sessions', { params: filters, ...getHeaders() });
    return response.data;
  },

  update: async (id: string, data: Partial<StudySessionData>) => {
    const response = await axios.put(`/api/study-sessions/${id}`, data, getHeaders());
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axios.delete(`/api/study-sessions/${id}`, getHeaders());
    return response.data;
  }
};
