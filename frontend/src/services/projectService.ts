import api from '@/lib/api';

export const projectService = {
  getAll: async (params?: Record<string, string>) => {
    const res = await api.get('/projects', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/projects/${id}`);
    return res.data.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    color?: string;
    priority?: string;
    deadline?: string | null;
    tags?: string[];
  }) => {
    const res = await api.post('/projects', data);
    return res.data;
  },

  update: async (id: string, data: Partial<{
    title: string;
    description: string;
    color: string;
    priority: string;
    status: string;
    deadline: string | null;
    tags: string[];
    isArchived: boolean;
  }>) => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};
