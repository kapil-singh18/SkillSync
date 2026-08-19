import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

/**
 * Initialises (or returns the existing) socket connection.
 * Must be called after login with the stored JWT.
 */
export const getSocket = () => {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('skillsync_token');
  if (!token) return null;

  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
};

/** Disconnect and nullify the socket (call on logout). */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { getSocket, disconnectSocket };
