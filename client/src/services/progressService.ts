import axios from './axiosInstance';

export const getUserTopicProgress = async (examId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`/api/users/exams/${examId}/progress`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateUserTopicProgress = async (examId: string, topicId: string, status: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(
    `/api/users/exams/${examId}/topics/${topicId}/progress`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getExamProgressAnalytics = async (examId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`/api/users/exams/${examId}/progress/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
