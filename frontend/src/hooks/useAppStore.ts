'use client';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { useEffect } from 'react';
import { fetchCurrentUser } from '@/store/authSlice';
import { initSocket, disconnectSocket } from '@/lib/socket';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !auth.isAuthenticated && !auth.isLoading) return;
    
    if (token && !auth.user) {
      dispatch(fetchCurrentUser());
    } else if (!token) {
      dispatch({ type: 'auth/fetchMe/rejected' });
    }
  }, []);

  // Handle Socket connection
  useEffect(() => {
    if (auth.user?._id) {
      initSocket(auth.user._id);
    } else if (!auth.isAuthenticated && !auth.isLoading) {
      disconnectSocket();
    }
    
    return () => {
      // Don't disconnect on every re-render, only on logout
    };
  }, [auth.user?._id, auth.isAuthenticated, auth.isLoading]);

  return auth;
};
