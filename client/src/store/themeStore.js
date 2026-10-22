import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: (() => {
    try {
      return localStorage.getItem('skillsync-theme') || 'dark';
    } catch {
      return 'dark';
    }
  })(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('skillsync-theme', next);
      } catch {
        // Storage not available
      }
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),

  setTheme: (theme) => {
    try {
      localStorage.setItem('skillsync-theme', theme);
    } catch {
      // Storage not available
    }
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));

export default useThemeStore;
