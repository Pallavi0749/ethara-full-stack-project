import api from '@/lib/api';

export const taskService = {
  getAll: async (params?: Record<string, string | undefined>) => {
    const res = await api.get('/tasks', { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/tasks/${id}`);
    return res.data.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    deadline?: string | null;
    estimatedHours?: number | null;
    assignee?: string | null;
    project: string;
    tags?: string[];
  }) => {
    const res = await api.post('/tasks', data);
    return res.data;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },

  getAISummary: async (id: string) => {
    const res = await api.get(`/tasks/${id}/ai-summary`);
    return res.data;
  },

  smartParse: async (prompt: string) => {
    const res = await api.post('/tasks/smart-parse', { prompt });
    return res.data;
  },

  uploadAttachment: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('attachment', file);
    const res = await api.post(`/tasks/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  addComment: async (id: string, text: string) => {
    const res = await api.post(`/tasks/${id}/comments`, { text });
    return res.data;
  },

  reorder: async (tasks: { id: string; status: string; order: number }[]) => {
    const res = await api.put('/tasks/reorder', { tasks });
    return res.data;
  },

  uploadAttachment: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('attachment', file);
    const res = await api.post(`/tasks/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
