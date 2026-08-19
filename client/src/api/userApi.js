import axiosInstance from './axiosInstance';

export const fetchMyProfile = () => axiosInstance.get('/users/profile');

export const updateMyProfile = (data) => axiosInstance.put('/users/profile', data);

export const fetchUserById = (id) => axiosInstance.get(`/users/${id}`);
