const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:3000',
        'http://localhost:3001',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join user-specific room for notifications
    socket.on('join_user', (userId) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their notification room`);
    });

    // Join project-specific room for real-time board updates
    socket.on('join_project', (projectId) => {
      socket.join(projectId);
      console.log(`📁 User joined project room: ${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(projectId);
      console.log(`📁 User left project room: ${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper to emit events
const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(projectId.toString()).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitToProject, emitToUser };
