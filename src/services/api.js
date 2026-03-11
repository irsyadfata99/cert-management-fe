import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true, // wajib untuk session cookie
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

    // 401 — session habis / tidak login
    // redirect ke login kecuali sudah di halaman login
    if (status === 401 && currentPath !== "/login") {
      window.location.href = "/login";
    }

    // 403 — tidak punya akses (role tidak sesuai)
    if (status === 403 && currentPath !== "/print") {
      window.location.href = "/forbidden";
    }

    return Promise.reject(error);
  },
);

export default api;
