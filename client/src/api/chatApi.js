import axiosInstance from './axiosInstance';

export const getConversations = () => axiosInstance.get('/chat/conversations');
export const getDirectMessages = (userId, page = 1) =>
  axiosInstance.get(`/chat/messages/${userId}?page=${page}`);
export const getRooms = () => axiosInstance.get('/chat/rooms');
export const createRoom = (data) => axiosInstance.post('/chat/rooms', data);
export const joinRoom = (roomId) => axiosInstance.post(`/chat/rooms/${roomId}/join`);
export const getRoomMessages = (roomId, page = 1) =>
  axiosInstance.get(`/chat/rooms/${roomId}/messages?page=${page}`);
