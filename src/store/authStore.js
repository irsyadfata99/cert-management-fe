import { create } from "zustand";
import { persist } from "zustand/middleware";
import authService from "../services/authService";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // ── Fetch current user dari /auth/me ──
      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return null;
        }
      },

      // ── Logout ──
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ user: null, isAuthenticated: false });
          window.location.href = "/login";
        }
      },

      // ── Helper role check ──
      isSuperAdmin: () => get().user?.role === "super_admin",
      isAdmin: () => get().user?.role === "admin",
      isTeacher: () => get().user?.role === "teacher",
    }),
    {
      name: "auth-storage",
      // hanya persist user & isAuthenticated, bukan isLoading
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
