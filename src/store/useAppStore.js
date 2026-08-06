import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // Hydration State (to prevent SSR mismatches)
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      // Theme State
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Active Contexts
      activeAgentId: null,
      setActiveAgentId: (id) => set({ activeAgentId: id }),

      activeWorkflowId: null,
      setActiveWorkflowId: (id) => set({ activeWorkflowId: id }),

      // Global UI State
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      activeModal: null, // string identifier
      modalData: null,
      openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'devinedesk-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
