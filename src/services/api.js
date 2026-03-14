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

    // 401 — session habis / tidak login
    if (status === 401 && currentPath !== "/login") {
      window.location.href = "/login";
    }

    // 403 — tidak punya akses, biarkan komponen handle error-nya
    // (tidak redirect karena /forbidden tidak terdaftar di router)

    return Promise.reject(error);
  },
);

export default api;
