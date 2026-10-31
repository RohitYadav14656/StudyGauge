import axios from 'axios';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export interface IntegrationItem {
  provider: 'google-calendar' | 'todoist' | 'notion' | 'github' | 'anki';
  name: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  authType: string;
  capabilities: string[];
  isConnected: boolean;
  accountName?: string | null;
  lastSyncAt?: string | null;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt?: string | null;
}

export const integrationService = {
  getIntegrations: async (): Promise<IntegrationItem[]> => {
    const res = await axios.get('/api/integrations', getHeaders());
    return res.data.data;
  },

  connectIntegration: async (
    provider: string,
    data: { accountName?: string; accessToken?: string; settings?: Record<string, any> } = {}
  ) => {
    const res = await axios.post(`/api/integrations/${provider}/connect`, data, getHeaders());
    return res.data;
  },

  disconnectIntegration: async (provider: string) => {
    const res = await axios.delete(`/api/integrations/${provider}`, getHeaders());
    return res.data;
  },

  syncIntegration: async (provider: string) => {
    const res = await axios.post(`/api/integrations/${provider}/sync`, {}, getHeaders());
    return res.data;
  },
};

