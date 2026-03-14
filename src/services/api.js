import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    // 401 — session expired / not logged in
    if (status === 401 && currentPath !== "/login") {
      // Clear Zustand persisted auth state before redirecting so stale
      // user data is not shown on the next page load.
      try {
        localStorage.removeItem("auth-storage");
      } catch (_) {
        // localStorage may not be available in all environments
      }
      window.location.href = "/login";
    }

    // 403 — insufficient permissions, let the component handle it
    return Promise.reject(error);
  },
);

export default api;
