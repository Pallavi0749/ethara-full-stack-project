import api from '@/lib/api';

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data.data;
  },
};

export const notificationService = {
  getAll: async (params?: { unread?: boolean; page?: number; limit?: number }) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  markAsRead: async (ids?: string[], all?: boolean) => {
    const res = await api.put('/notifications/read', { ids, all });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};

export const activityService = {
  getByProject: async (projectId: string, params?: { page?: number; limit?: number }) => {
    const res = await api.get(`/activity/${projectId}`, { params });
    return res.data;
  },
};

export const teamService = {
  invite: async (data: { email: string; role?: string; projectId: string }) => {
    const res = await api.post('/team/invite', data);
    return res.data;
  },

  updateRole: async (data: { memberId: string; role: string; projectId: string }) => {
    const res = await api.put('/team/role', data);
    return res.data;
  },

  removeMember: async (projectId: string, memberId: string) => {
    const res = await api.delete(`/team/${projectId}/${memberId}`);
    return res.data;
  },

  getMembers: async (projectId: string) => {
    const res = await api.get(`/team/${projectId}/members`);
    return res.data.data;
  },
};
