import axiosInstance from './axiosInstance';

export const sendConnectionRequest = (data) =>
  axiosInstance.post('/connections', data);

export const getConnections = (params) =>
  axiosInstance.get('/connections', { params });

export const getIncomingRequests = () =>
  axiosInstance.get('/connections/requests/incoming');

export const getOutgoingRequests = () =>
  axiosInstance.get('/connections/requests/outgoing');

export const getConnectionStatus = (userId) =>
  axiosInstance.get(`/connections/status/${userId}`);

export const acceptRequest = (id) =>
  axiosInstance.put(`/connections/${id}/accept`);

export const declineRequest = (id) =>
  axiosInstance.put(`/connections/${id}/decline`);

export const cancelRequest = (id) =>
  axiosInstance.put(`/connections/${id}/cancel`);

export const removeConnection = (id) =>
  axiosInstance.delete(`/connections/${id}`);

