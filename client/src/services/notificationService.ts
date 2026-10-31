import axios from 'axios';

export type NotificationType =
  | 'revision_due'
  | 'missed_study_plan'
  | 'goal_progress'
  | 'recommendation'
  | 'upcoming_exam'
  | 'planner_changes'
  | 'system';

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  link?: string;
  dedupKey?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  channels?: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean | string;
  type?: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const notificationService = {
  getNotifications: async (params: NotificationQueryParams = {}): Promise<NotificationListResponse> => {
    const token = localStorage.getItem('token');
    if (!token) return { notifications: [], total: 0, page: 1, totalPages: 1, unreadCount: 0 };
    const res = await axios.get('/api/notifications', {
      params,
      ...getHeaders(),
    });
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    const res = await axios.get('/api/notifications/unread-count', {
      ...getHeaders(),
    });
    return res.data?.data?.unreadCount || 0;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await axios.patch(`/api/notifications/${id}/read`, {}, getHeaders());
    return res.data.data;
  },

  markAllAsRead: async (): Promise<{ modifiedCount: number }> => {
    const res = await axios.patch('/api/notifications/mark-all-read', {}, getHeaders());
    return res.data.data;
  },

  deleteNotification: async (id: string): Promise<boolean> => {
    const res = await axios.delete(`/api/notifications/${id}`, getHeaders());
    return res.data.success;
  },

  syncNotifications: async (): Promise<NotificationListResponse> => {
    const res = await axios.post('/api/notifications/generate', {}, getHeaders());
    return res.data.data;
  },

  createTestNotification: async (data: Partial<NotificationItem>): Promise<any> => {
    const res = await axios.post('/api/notifications/test', data, getHeaders());
    return res.data.data;
  },
};
