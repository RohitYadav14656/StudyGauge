import axios from 'axios';

export type ActivityType =
  | 'study_session'
  | 'mock_test'
  | 'pyq_attempt'
  | 'revision'
  | 'planner_item';

export interface TimelineActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  durationMinutes: number | null;
  metadata: Record<string, any>;
  sourceId: string;
}

export interface TimelinePagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface TimelineResponse {
  success: boolean;
  data: TimelineActivity[];
  pagination: TimelinePagination;
  availableTypes: ActivityType[];
}

export interface TimelineFilterParams {
  startDate?: string;
  endDate?: string;
  types?: string;
  page?: number;
  limit?: number;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const activityTimelineService = {
  getTimeline: async (filters: TimelineFilterParams = {}): Promise<TimelineResponse> => {
    const response = await axios.get('/api/activity-timeline', {
      params: filters,
      ...getHeaders(),
    });
    return response.data;
  },
};
