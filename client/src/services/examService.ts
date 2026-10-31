import axios from 'axios';

export const getExams = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/api/exams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getUserExams = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/api/users/exams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const selectBatchExams = async (exams: { examId: string; targetDate?: string; targetScore?: string; targetRank?: number }[]) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/api/users/exams/batch', { exams }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createExam = async (examData: { name: string; description: string; level: string; metadata?: any }) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/api/exams', examData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateExam = async (id: string, examData: { name?: string; description?: string; level?: string; metadata?: any }) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`/api/exams/${id}`, examData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
