import api from "./api";

const centerService = {
  // ── Super Admin ──
  getAll: (params) =>
    api.get("/super-admin/centers", { params }).then((r) => r.data),

  create: (data) => api.post("/super-admin/centers", data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/super-admin/centers/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/super-admin/centers/${id}/deactivate`).then((r) => r.data),

  // ── Admin (read-only, active centers only) ──
  getAllForAdmin: (params) =>
    api.get("/admin/centers", { params }).then((r) => r.data),
};

export default centerService;
