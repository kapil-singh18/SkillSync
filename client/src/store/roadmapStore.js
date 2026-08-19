import { create } from 'zustand';
import * as roadmapApi from '../api/roadmapApi';

const useRoadmapStore = create((set, get) => ({
  roadmaps: [],
  activeRoadmap: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  fetchRoadmaps: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await roadmapApi.fetchRoadmaps();
      set({ roadmaps: res.data.roadmaps, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load roadmaps',
        isLoading: false,
      });
    }
  },

  fetchRoadmapById: async (id) => {
    set({ isLoading: true, error: null, activeRoadmap: null });
    try {
      const res = await roadmapApi.fetchRoadmapById(id);
      set({ activeRoadmap: res.data.roadmap, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load roadmap detail',
        isLoading: false,
      });
    }
  },

  generateRoadmap: async ({ topic, level }) => {
    set({ isGenerating: true, error: null });
    try {
      const res = await roadmapApi.createRoadmap({ topic, level });
      const newRoadmap = res.data.roadmap;
      set((s) => ({
        roadmaps: [newRoadmap, ...s.roadmaps],
        activeRoadmap: newRoadmap,
        isGenerating: false,
      }));
      return newRoadmap;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to generate roadmap',
        isGenerating: false,
      });
      throw err;
    }
  },

  toggleStep: async (roadmapId, stepId) => {
    try {
      const res = await roadmapApi.toggleStepCompleted(roadmapId, stepId);
      const updated = res.data.roadmap;

      set((s) => ({
        activeRoadmap: updated,
        roadmaps: s.roadmaps.map((r) => (r._id === updated._id ? updated : r)),
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to update step status',
      });
    }
  },

  removeRoadmap: async (id) => {
    try {
      await roadmapApi.deleteRoadmap(id);
      set((s) => ({
        roadmaps: s.roadmaps.filter((r) => r._id !== id),
        activeRoadmap: s.activeRoadmap?._id === id ? null : s.activeRoadmap,
      }));
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to remove roadmap',
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useRoadmapStore;
