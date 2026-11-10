import { create } from 'zustand';
import * as matchApi from '../api/matches';
import useToastStore from './toastStore';

const useMatchStore = create((set, get) => ({
  // ── State per type ──────────────────────────────────────────────────────────
  peer: { results: [], page: 1, totalPages: 1, total: 0, isLoading: false, needsProfile: false },
  mentor: { results: [], page: 1, totalPages: 1, total: 0, isLoading: false, needsProfile: false },

  // ── Fetch discover (replaces current page) ──────────────────────────────────
  fetchDiscover: async (type = 'peer', params = {}) => {
    set((s) => ({ [type]: { ...s[type], isLoading: true } }));
    try {
      const { data } = await matchApi.discoverMatches({ type, page: 1, limit: 12, ...params });
      set((s) => ({
        [type]: {
          ...s[type],
          results: data.results || [],
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          needsProfile: data.needsProfile || false,
          isLoading: false,
        },
      }));
    } catch (err) {
      set((s) => ({ [type]: { ...s[type], isLoading: false } }));
      useToastStore.getState().addToast({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to load matches.',
      });
    }
  },

  // ── Load more (append next page) ────────────────────────────────────────────
  loadMore: async (type = 'peer', params = {}) => {
    const current = get()[type];
    if (current.isLoading || current.page >= current.totalPages) return;

    const nextPage = current.page + 1;
    set((s) => ({ [type]: { ...s[type], isLoading: true } }));
    try {
      const { data } = await matchApi.discoverMatches({ type, page: nextPage, limit: 12, ...params });
      set((s) => ({
        [type]: {
          ...s[type],
          results: [...s[type].results, ...(data.results || [])],
          page: data.page || nextPage,
          totalPages: data.totalPages || s[type].totalPages,
          total: data.total || s[type].total,
          isLoading: false,
        },
      }));
    } catch (err) {
      set((s) => ({ [type]: { ...s[type], isLoading: false } }));
      useToastStore.getState().addToast({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to load more matches.',
      });
    }
  },

  // ── Dismiss a user (optimistic) ─────────────────────────────────────────────
  dismiss: async (userId, type = 'peer') => {
    // Optimistic: remove from list immediately
    const prev = get()[type].results;
    set((s) => ({
      [type]: {
        ...s[type],
        results: s[type].results.filter((r) => String(r.user._id) !== String(userId)),
        total: Math.max(0, s[type].total - 1),
      },
    }));

    try {
      await matchApi.dismissUser(userId);
    } catch {
      // Rollback
      set((s) => ({ [type]: { ...s[type], results: prev, total: prev.length } }));
      useToastStore.getState().addToast({ type: 'error', message: 'Failed to dismiss user.' });
    }
  },

  // ── Clear all dismissals ─────────────────────────────────────────────────────
  clearDismissed: async (type = 'peer') => {
    try {
      await matchApi.clearDismissed();
      useToastStore.getState().addToast({ type: 'success', message: 'Dismissed users cleared. Refreshing matches…' });
      get().fetchDiscover(type);
    } catch {
      useToastStore.getState().addToast({ type: 'error', message: 'Failed to clear dismissed users.' });
    }
  },

  // ── Remove a result card after connecting ───────────────────────────────────
  removeResult: (userId, type) => {
    set((s) => ({
      [type]: {
        ...s[type],
        results: s[type].results.filter((r) => String(r.user._id) !== String(userId)),
        total: Math.max(0, s[type].total - 1),
      },
    }));
  },
}));

export default useMatchStore;

