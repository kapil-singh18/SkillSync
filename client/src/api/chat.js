import axiosInstance from './axiosInstance';

// ── Conversations ─────────────────────────────────────────────────────────────
export const getConversations = () => axiosInstance.get('/chat/conversations');
export const getDMMessages = (userId, params) =>
  axiosInstance.get(`/chat/conversations/${userId}/messages`, { params });
export const markDMRead = (userId) => axiosInstance.post(`/chat/conversations/${userId}/read`);

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const getMyRooms = () => axiosInstance.get('/chat/rooms/mine');
export const discoverRooms = (params) => axiosInstance.get('/chat/rooms/discover', { params });
export const createRoom = (data) => axiosInstance.post('/chat/rooms', data);
export const getRoom = (id) => axiosInstance.get(`/chat/rooms/${id}`);
export const joinRoom = (id) => axiosInstance.post(`/chat/rooms/${id}/join`);
export const joinByCode = (code) => axiosInstance.post('/chat/rooms/join-by-code', { code });
export const leaveRoom = (id) => axiosInstance.post(`/chat/rooms/${id}/leave`);
export const updateRoom = (id, data) => axiosInstance.put(`/chat/rooms/${id}`, data);
export const removeMember = (roomId, userId) =>
  axiosInstance.delete(`/chat/rooms/${roomId}/members/${userId}`);
export const archiveRoom = (id) => axiosInstance.delete(`/chat/rooms/${id}`);
export const getRoomMessages = (id, params) =>
  axiosInstance.get(`/chat/rooms/${id}/messages`, { params });

// ── Messages ──────────────────────────────────────────────────────────────────
export const deleteMessage = (id) => axiosInstance.delete(`/chat/messages/${id}`);

// ── Presence ──────────────────────────────────────────────────────────────────
export const getPresence = (ids) =>
  axiosInstance.get('/chat/presence', { params: { ids: ids.join(',') } });

