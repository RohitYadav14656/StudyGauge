import axios from 'axios';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export interface RevisionDueItem {
  _id: string;
  topicId: {
    _id: string;
    name: string;
    subjectId?: {
      _id: string;
      name: string;
    };
  } | string;
  topicName?: string;
  subjectName?: string | null;
  stage: number;
  revisionCount: number;
  lastRevisionDate: string;
  nextRevisionDate: string;
  intervalDays: number;
  status: 'PENDING' | 'DUE' | 'OVERDUE' | 'COMPLETED';
  daysOverdue?: number;
}

export interface RevisionsResponse {
  dueTodayCount: number;
  overdueCount: number;
  totalDue: number;
  revisions: RevisionDueItem[];
}

export const revisionService = {
  getDueRevisions: async (params?: { examId?: string; subjectId?: string }): Promise<RevisionsResponse> => {
    const res = await axios.get('/api/revisions/due', {
      ...getHeaders(),
      params,
    });
    return res.data.data;
  },

  logRevision: async (data: {
    topicId: string;
    isCompleted?: boolean;
    confidenceLevel?: 'low' | 'medium' | 'high';
    notes?: string;
  }) => {
    const res = await axios.post('/api/revisions', data, getHeaders());
    return res.data.data;
  },
};

