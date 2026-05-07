import api from '@/lib/api';
import type { User } from '@/types';

export const authService = {
  signup: async (data: { name: string; email: string; password: string }) => {
    const res = await api.post('/auth/signup', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post('/auth/login', data);
    if (res.data.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
    }
    return res.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  updateProfile: async (data: FormData) => {
    const res = await api.put('/auth/me', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string) => {
    const res = await api.post(`/auth/reset-password/${token}`, { password });
    return res.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  },
};
