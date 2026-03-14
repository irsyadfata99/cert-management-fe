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
          // [FIX #11] reset isAuthenticated saat fetchMe gagal
          // agar tidak stale dari localStorage
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
      // [FIX #11] hanya persist `user`, BUKAN `isAuthenticated`
      // isAuthenticated selalu dihitung ulang dari hasil fetchMe
      // sehingga tidak bisa stale di localStorage
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
