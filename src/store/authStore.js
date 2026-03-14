import { create } from "zustand";
import { persist } from "zustand/middleware";
import authService from "../services/authService";

// Persisted user is treated as stale after this duration (ms).
// fetchMe will still run on every AuthGuard mount; this is just a
// secondary guard so deactivated users do not see old role/name briefly.
const PERSIST_TTL_MS = 60 * 60 * 1000; // 1 hour

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _persistedAt: null,

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            _persistedAt: Date.now(),
          });
          return user;
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            _persistedAt: null,
          });
          return null;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ user: null, isAuthenticated: false, _persistedAt: null });
          window.location.href = "/login";
        }
      },

      // Returns the persisted user only if it is still within TTL.
      // Used by AuthGuard to decide whether to show stale name during fetchMe.
      getFreshPersistedUser: () => {
        const { user, _persistedAt } = get();
        if (!user || !_persistedAt) return null;
        if (Date.now() - _persistedAt > PERSIST_TTL_MS) return null;
        return user;
      },

      isSuperAdmin: () => get().user?.role === "super_admin",
      isAdmin: () => get().user?.role === "admin",
      isTeacher: () => get().user?.role === "teacher",
    }),
    {
      name: "auth-storage",
      // Persist user + timestamp only. isAuthenticated is always false
      // on hydration and only becomes true after a successful fetchMe.
      partialize: (state) => ({
        user: state.user,
        _persistedAt: state._persistedAt,
      }),
    },
  ),
);

export default useAuthStore;
