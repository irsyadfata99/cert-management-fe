import axios from "axios";

// Auth routes di backend mount di /auth (tanpa /api prefix)
const authBase = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:3000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const authService = {
  // Redirect ke Google OAuth
  loginWithGoogle: () => {
    window.location.href = import.meta.env.VITE_GOOGLE_LOGIN_URL;
  },

  // Get current logged-in user
  getMe: async () => {
    const res = await authBase.get("/auth/me");
    return res.data.data; // { id, name, email, role, center_id, photo }
  },

  // Logout
  logout: async () => {
    await authBase.post("/auth/logout");
  },
};

export default authService;
