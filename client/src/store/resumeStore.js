import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const useResumeStore = create((set) => ({
  analysis: null,
  isAnalyzing: false,
  error: null,

  analyzeResume: async (file) => {
    set({ isAnalyzing: true, error: null, analysis: null });
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const { data } = await axiosInstance.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      set({ analysis: data.data, isAnalyzing: false });
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to analyze resume';
      set({ error: msg, isAnalyzing: false });
      throw new Error(msg);
    }
  },

  clearAnalysis: () => set({ analysis: null, error: null }),
}));

export default useResumeStore;
