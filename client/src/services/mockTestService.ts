import axios from 'axios';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export interface SubjectPerformance {
  subject: string;
  score: number;
}

export interface TopicPerformance {
  topic: string;
  score: number;
}

export interface MockTestData {
  _id?: string;
  testName: string;
  exam: string;
  date: string;
  totalMarks: number;
  obtainedMarks: number;
  questionsAttempted: number;
  correct: number;
  wrong: number;
  timeTaken: number;
  subjectPerformance?: SubjectPerformance[];
  topicPerformance?: TopicPerformance[];
  createdAt?: string;
}

export const mockTestService = {
  getMockTests: async () => {
    const res = await axios.get('/api/mock-tests', getHeaders());
    return res.data;
  },

  getMockTestById: async (id: string) => {
    const res = await axios.get(`/api/mock-tests/${id}`, getHeaders());
    return res.data;
  },

  createMockTest: async (data: Partial<MockTestData>) => {
    const res = await axios.post('/api/mock-tests', data, getHeaders());
    return res.data;
  }
};
