import axios from './axiosInstance';
import { StudyPlanItemData } from './studyPlanService';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const plannerService = {
  getPlannerItems: async (startDate?: string, endDate?: string) => {
    let url = `/api/planner`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    } else if (startDate) {
      url += `?startDate=${startDate}`;
    }
    const res = await axios.get(url, getHeaders());
    return res.data;
  },

  updateItemStatus: async (itemId: string, data: Partial<StudyPlanItemData>) => {
    const res = await axios.put(`/api/planner/${itemId}`, data, getHeaders());
    return res.data;
  }
};
