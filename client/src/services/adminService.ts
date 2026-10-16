import axios from 'axios';

export const getDashboardStats = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
