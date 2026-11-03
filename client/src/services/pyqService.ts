import axios from './axiosInstance';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export interface PYQOption {
  _id?: string;
  text: string;
  isCorrect?: boolean;
}

export interface PYQData {
  _id: string;
  examId: any;
  subjectId: any;
  topicId: any;
  year: number;
  questionText: string;
  options: PYQOption[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface PYQAttemptResponse {
  success: boolean;
  data: {
    _id: string;
    userId: string;
    pyqId: string;
    isCorrect: boolean;
    timeTakenSeconds: number;
    selectedOptionIndex: number;
  };
  explanation: string;
  correctOptionIndex: number;
}

export interface GetPYQsParams {
  page?: number;
  limit?: number;
  examId?: string;
  subjectId?: string;
  topicId?: string;
  year?: number;
  difficulty?: string;
  tags?: string;
  search?: string;
}

export interface PYQStatsData {
  overall: {
    totalAttempted: number;
    correct: number;
    wrong: number;
    accuracy: number;
    totalBookmarked: number;
    totalRevision: number;
    avgTimeTaken: number;
  };
  bySubject: Array<{
    _id: string;
    subjectName: string;
    attempted: number;
    correct: number;
    wrong: number;
    accuracy: number;
  }>;
}

export const pyqService = {
  getPYQs: async (params: GetPYQsParams = {}) => {
    const response = await axios.get('/api/pyqs', { params, ...getHeaders() });
    return response.data;
  },

  getPYQ: async (id: string) => {
    const response = await axios.get(`/api/pyqs/${id}`, getHeaders());
    return response.data;
  },

  attemptPYQ: async (pyqId: string, selectedOptionIndex: number, timeTakenSeconds: number): Promise<PYQAttemptResponse> => {
    const response = await axios.post(`/api/pyqs/${pyqId}/attempt`, {
      selectedOptionIndex,
      timeTakenSeconds
    }, getHeaders());
    return response.data;
  },

  getPYQStats: async (): Promise<{ success: boolean; data: PYQStatsData }> => {
    const response = await axios.get('/api/pyqs/stats', getHeaders());
    return response.data;
  },

  toggleBookmark: async (id: string): Promise<{ success: boolean; bookmarked: boolean }> => {
    const response = await axios.patch(`/api/pyqs/${id}/bookmark`, {}, getHeaders());
    return response.data;
  },

  toggleRevision: async (id: string): Promise<{ success: boolean; markedForRevision: boolean }> => {
    const response = await axios.patch(`/api/pyqs/${id}/revision`, {}, getHeaders());
    return response.data;
  },

  getBookmarks: async (page = 1, limit = 10) => {
    const response = await axios.get('/api/pyqs/bookmarks', { params: { page, limit }, ...getHeaders() });
    return response.data;
  },

  getRevisionList: async (page = 1, limit = 10) => {
    const response = await axios.get('/api/pyqs/revision', { params: { page, limit }, ...getHeaders() });
    return response.data;
  },

  getAttempts: async (page = 1, limit = 10) => {
    const response = await axios.get('/api/pyqs/attempts', { params: { page, limit }, ...getHeaders() });
    return response.data;
  }
};
