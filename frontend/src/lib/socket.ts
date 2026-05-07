import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

export const initSocket = (userId: string) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('🔌 Connected to WebSocket');
    socket?.emit('join_user', userId);
  });

  return socket;
};

export const getSocket = () => socket;

export const joinProject = (projectId: string) => {
  socket?.emit('join_project', projectId);
};

export const leaveProject = (projectId: string) => {
  socket?.emit('leave_project', projectId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
