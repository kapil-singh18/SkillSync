/**
 * lib/socket.js
 *
 * Socket.IO singleton client.
 * - Connects only when authenticated (call connect(token))
 * - Reconnects automatically with exponential backoff
 * - Disconnects on logout (call disconnect())
 * - Provides emitWithAck(event, data, timeout=8000) helper
 */

import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

/** Connect (or reconnect) with a fresh JWT. */
export const connectSocket = (token) => {
  if (socket && socket.connected) {
    // Refresh token for next reconnect
    socket.auth = { token };
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    autoConnect: true,
  });

  // Refresh token before each reconnect attempt
  socket.on('reconnect_attempt', () => {
    try {
      const freshToken = localStorage.getItem('skillsync-token');
      if (freshToken) socket.auth = { token: freshToken };
    } catch {
      // ignore
    }
  });

  return socket;
};

/** Disconnect and destroy the socket. */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Get the current socket instance (may be null). */
export const getSocket = () => socket;

/**
 * Emit with ack and a timeout.
 * @param {string} event
 * @param {object} data
 * @param {number} timeoutMs
 * @returns {Promise<{ ok, data, error }>}
 */
export const emitWithAck = (event, data, timeoutMs = 8000) => {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s || !s.connected) {
      resolve({ ok: false, error: 'not_connected' });
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, error: 'timeout' });
      }
    }, timeoutMs);

    s.emit(event, data, (response) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(response || { ok: false, error: 'no_ack' });
      }
    });
  });
};

