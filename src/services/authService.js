import api from "./api";

const authService = {
  // ── Redirect ke Google OAuth ──
  loginWithGoogle: () => {
    window.location.href = import.meta.env.VITE_GOOGLE_LOGIN_URL;
  },

  // ── Get current logged-in user ──
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data.data; // { id, name, email, role, center_id, center_name, photo }
  },

  // ── Logout ──
  logout: async () => {
    await api.post("/auth/logout");
  },
};

export default authService;
