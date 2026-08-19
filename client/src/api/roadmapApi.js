import axiosInstance from './axiosInstance';

export const createRoadmap = (data) => axiosInstance.post('/roadmaps', data);
export const fetchRoadmaps = () => axiosInstance.get('/roadmaps');
export const fetchRoadmapById = (id) => axiosInstance.get(`/roadmaps/${id}`);
export const toggleStepCompleted = (roadmapId, stepId) =>
  axiosInstance.put(`/roadmaps/${roadmapId}/steps/${stepId}`);
export const deleteRoadmap = (id) => axiosInstance.delete(`/roadmaps/${id}`);
