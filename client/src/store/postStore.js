import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const usePostStore = create((set, get) => ({
  posts: [],
  pagination: { page: 1, pages: 1, total: 0 },
  isLoading: false,
  error: null,

  // ─── Fetch feed ─────────────────────────────────────────────────────────────
  fetchFeed: async (page = 1, sort = 'recent', tag = '') => {
    set({ isLoading: true, error: null });
    try {
      const params = { page, limit: 15, sort };
      if (tag) params.tag = tag;
      const { data } = await axiosInstance.get('/posts', { params });
      set({
        posts: page === 1 ? data.data : [...get().posts, ...data.data],
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load feed', isLoading: false });
    }
  },

  // ─── Create post ───────────────────────────────────────────────────────────
  createPost: async (content, tags = []) => {
    try {
      const { data } = await axiosInstance.post('/posts', { content, tags });
      set((s) => ({ posts: [data.data, ...s.posts] }));
      return data.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create post');
    }
  },

  // ─── Toggle upvote ────────────────────────────────────────────────────────
  toggleUpvote: async (postId) => {
    try {
      const { data } = await axiosInstance.put(`/posts/${postId}/upvote`);
      set((s) => ({
        posts: s.posts.map((p) => (p._id === postId ? data.data : p)),
      }));
    } catch {
      // Non-blocking UI action
    }
  },

  // ─── Delete post ──────────────────────────────────────────────────────────
  deletePost: async (postId) => {
    try {
      await axiosInstance.delete(`/posts/${postId}`);
      set((s) => ({ posts: s.posts.filter((p) => p._id !== postId) }));
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete post');
    }
  },

  // ─── Comments ─────────────────────────────────────────────────────────────
  fetchComments: async (postId) => {
    try {
      const { data } = await axiosInstance.get(`/posts/${postId}/comments`);
      return data.data;
    } catch {
      return [];
    }
  },

  addComment: async (postId, content) => {
    try {
      const { data } = await axiosInstance.post(`/posts/${postId}/comments`, { content });
      // Increment local comment count
      set((s) => ({
        posts: s.posts.map((p) =>
          p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
        ),
      }));
      return data.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to add comment');
    }
  },
}));

export default usePostStore;
