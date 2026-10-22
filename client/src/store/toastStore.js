import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set) => ({
  toasts: [],

  addToast: ({ type = 'info', message, duration = 4000 }) => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export default useToastStore;
