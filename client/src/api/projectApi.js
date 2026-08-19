import axiosInstance from './axiosInstance';

export const fetchAllProjects = (skills) =>
  axiosInstance.get(`/projects${skills ? `?skills=${skills}` : ''}`);

export const fetchMyProjects = () => axiosInstance.get('/projects/mine');

export const fetchProjectById = (id) => axiosInstance.get(`/projects/${id}`);

export const createProject = (data) => axiosInstance.post('/projects', data);

export const joinProject = (id) => axiosInstance.post(`/projects/${id}/join`);

export const fetchTasksByProject = (projectId) =>
  axiosInstance.get(`/tasks/project/${projectId}`);

export const createTask = (data) => axiosInstance.post('/tasks', data);

export const updateTask = (id, data) => axiosInstance.put(`/tasks/${id}`, data);

export const deleteTask = (id) => axiosInstance.delete(`/tasks/${id}`);
