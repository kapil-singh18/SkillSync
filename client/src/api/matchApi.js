import axiosInstance from './axiosInstance';

export const fetchDiscover = () => axiosInstance.get('/matches/discover');

export const connectUser = (userId) => axiosInstance.post(`/matches/${userId}/connect`);

export const dismissUser = (userId) => axiosInstance.post(`/matches/${userId}/dismiss`);

export const fetchConnections = () => axiosInstance.get('/matches/connections');
