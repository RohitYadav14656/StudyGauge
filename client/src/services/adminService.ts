import axios from './axiosInstance';

export const getDashboardStats = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getAdminUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateUserRole = async (userId: string, role: 'student' | 'admin') => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(
    `/api/admin/users/${userId}/role`,
    { role },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteAdminUser = async (userId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`/api/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createAdminPYQ = async (data: any) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/api/pyqs', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteAdminPYQ = async (pyqId: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`/api/pyqs/${pyqId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
