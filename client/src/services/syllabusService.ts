import axios from 'axios';

export const getExamSyllabus = async (examId: string) => {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await axios.get(`/api/exams/${examId}/syllabus`, { headers });
  return response.data;
};

export const getSubjects = async (examId?: string) => {
  const token = localStorage.getItem('token');
  const params = examId ? { examId } : {};
  const response = await axios.get('/api/subjects', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createSubject = async (data: any) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/api/subjects', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateSubject = async (id: string, data: any) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`/api/subjects/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getTopics = async (examId?: string, subjectId?: string) => {
  const token = localStorage.getItem('token');
  const params: any = {};
  if (examId) params.examId = examId;
  if (subjectId) params.subjectId = subjectId;
  
  const response = await axios.get('/api/topics', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createTopic = async (data: any) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/api/topics', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateTopic = async (id: string, data: any) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`/api/topics/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
