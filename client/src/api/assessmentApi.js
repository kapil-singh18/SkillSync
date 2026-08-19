import axiosInstance from './axiosInstance';

export const generateAssessment = (data) =>
  axiosInstance.post('/assessments/generate', data);
export const submitAssessment = (id, data) =>
  axiosInstance.post(`/assessments/${id}/submit`, data);
export const fetchHistory = () => axiosInstance.get('/assessments/history');
