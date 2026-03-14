import { create } from "zustand";
import { persist } from "zustand/middleware";
import authService from "../services/authService";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      // [FIX #11] isAuthenticated tidak di-persist, selalu false saat init
      // nilai true hanya datang dari fetchMe yang berhasil
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
          // [FIX #11] reset keduanya saat fetchMe gagal
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
      // [FIX #11] hanya persist user, BUKAN isAuthenticated
      // Saat page refresh: user ada di localStorage (untuk pre-fill),
      // tapi isAuthenticated tetap false sampai fetchMe berhasil.
      // AuthGuard menunggu fetchMe selesai (via checking state)
      // sebelum redirect, jadi tidak ada flash redirect ke /login.
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
