import { create } from 'zustand';

const useSidebarStore = create((set) => ({
  collapsed: (() => {
    try {
      return localStorage.getItem('skillsync-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  })(),
  mobileOpen: false,

  toggleCollapsed: () =>
    set((state) => {
      const next = !state.collapsed;
      try {
        localStorage.setItem('skillsync-sidebar-collapsed', String(next));
      } catch {
        // Storage not available
      }
      return { collapsed: next };
    }),

  setMobileOpen: (open) => set({ mobileOpen: open }),
  toggleMobileOpen: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
}));

export default useSidebarStore;
