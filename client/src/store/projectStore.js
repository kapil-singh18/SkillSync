import { create } from 'zustand';
import * as projectApi from '../api/projectApi';

const useProjectStore = create((set) => ({
  projects: [],
  myProjects: [],
  activeProject: null,
  tasks: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchProjects: async (skills = '') => {
    set({ isLoading: true, error: null });
    try {
      const res = await projectApi.fetchAllProjects(skills);
      set({ projects: res.data.projects, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load projects', isLoading: false });
    }
  },

  fetchMyProjects: async () => {
    try {
      const res = await projectApi.fetchMyProjects();
      set({ myProjects: res.data.projects });
    } catch {
      // silently fail — not critical path
    }
  },

  fetchProjectById: async (id) => {
    set({ isLoading: true, error: null, activeProject: null, tasks: [] });
    try {
      const res = await projectApi.fetchProjectById(id);
      set({ activeProject: res.data.project, tasks: res.data.tasks, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load project', isLoading: false });
    }
  },

  createProject: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const res = await projectApi.createProject(data);
      set((s) => ({
        projects: [res.data.project, ...s.projects],
        myProjects: [res.data.project, ...s.myProjects],
        isSaving: false,
      }));
      return res.data.project;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to create project', isSaving: false });
      throw err;
    }
  },

  joinProject: async (id) => {
    try {
      const res = await projectApi.joinProject(id);
      const updated = res.data.project;
      set((s) => ({
        projects: s.projects.map((p) => p._id === updated._id ? updated : p),
        myProjects: s.myProjects.some((p) => p._id === updated._id)
          ? s.myProjects
          : [updated, ...s.myProjects],
      }));
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to join project' });
      throw err;
    }
  },

  // ── Task actions ────────────────────────────────────────────
  createTask: async (data) => {
    const res = await projectApi.createTask(data);
    set((s) => ({ tasks: [...s.tasks, res.data.task] }));
    return res.data.task;
  },

  updateTask: async (id, data) => {
    const res = await projectApi.updateTask(id, data);
    set((s) => ({
      tasks: s.tasks.map((t) => t._id === id ? res.data.task : t),
    }));
    return res.data.task;
  },

  deleteTask: async (id) => {
    await projectApi.deleteTask(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }));
  },

  clearError: () => set({ error: null }),
}));

export default useProjectStore;
