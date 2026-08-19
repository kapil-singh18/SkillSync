import { create } from 'zustand';
import * as assessmentApi from '../api/assessmentApi';

const useAssessmentStore = create((set, get) => ({
  currentAssessment: null,
  attemptResult: null,
  history: [],
  isLoading: false,
  isGenerating: false,
  isSubmitting: false,
  error: null,

  generateAssessment: async ({ skillName, difficulty }) => {
    set({
      isGenerating: true,
      error: null,
      currentAssessment: null,
      attemptResult: null,
    });
    try {
      const res = await assessmentApi.generateAssessment({
        skillName,
        difficulty,
      });
      set({
        currentAssessment: res.data.assessment,
        isGenerating: false,
      });
      return res.data.assessment;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to generate assessment',
        isGenerating: false,
      });
      throw err;
    }
  },

  submitAssessment: async (assessmentId, answers) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await assessmentApi.submitAssessment(assessmentId, {
        answers,
      });
      set({
        attemptResult: res.data.result,
        isSubmitting: false,
      });
      // Refresh history in background
      get().fetchHistory();
      return res.data.result;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to submit assessment',
        isSubmitting: false,
      });
      throw err;
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await assessmentApi.fetchHistory();
      set({ history: res.data.history, isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to load assessment history',
        isLoading: false,
      });
    }
  },

  resetAssessment: () => {
    set({
      currentAssessment: null,
      attemptResult: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

export default useAssessmentStore;
