// Auth endpoints (/auth/me, /auth/logout, /auth/google) are mounted at the
// server root, NOT under /api.  We derive the auth base URL from VITE_API_URL
// so there is only one env var to set and one axios instance to maintain.
//
// Example:
//   VITE_API_URL = "http://localhost:3000/api"
//   → authBase   = "http://localhost:3000"
//
// The shared `api` instance is used directly with absolute URLs so its
// interceptors (401 redirect, credentials, etc.) still apply.

import api from "./api";

const getAuthBase = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  // Strip trailing /api segment to get the server root.
  return apiUrl.replace(/\/api\/?$/, "");
};

const authService = {
  // Redirect to Google OAuth — browser navigation, no axios needed.
  loginWithGoogle: () => {
    window.location.href = `${getAuthBase()}/auth/google`;
  },

  // Get current logged-in user from the session cookie.
  getMe: async () => {
    const res = await api.get(`${getAuthBase()}/auth/me`);
    return res.data.data;
  },

  // Invalidate the server-side session.
  logout: async () => {
    await api.post(`${getAuthBase()}/auth/logout`);
  },
};

export default authService;
