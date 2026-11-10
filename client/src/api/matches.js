import axiosInstance from './axiosInstance';

export const discoverMatches = (params) =>
  axiosInstance.get('/matches/discover', { params });

export const dismissUser = (userId) =>
  axiosInstance.post(`/matches/${userId}/dismiss`);

export const clearDismissed = () =>
  axiosInstance.delete('/matches/dismissed');

