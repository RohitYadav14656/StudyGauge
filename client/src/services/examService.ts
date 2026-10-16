import axios from 'axios';

// Get all available exams from the backend
export const getExams = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/api/exams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get the current user's selected exams
export const getUserExams = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/api/users/exams', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Select or update multiple exams at once
export const selectBatchExams = async (exams: { examId: string; targetDate?: string; targetScore?: string; targetRank?: number }[]) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/api/users/exams/batch', { exams }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Admin: Create a new exam
export const createExam = async (examData: { name: string; description: string; level: string; metadata?: any }) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/api/exams', examData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Admin: Update an existing exam
export const updateExam = async (id: string, examData: { name?: string; description?: string; level?: string; metadata?: any }) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`/api/exams/${id}`, examData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
