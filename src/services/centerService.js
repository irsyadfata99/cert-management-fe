import api from "./api";

const centerService = {
  getAll: (params) =>
    api.get("/super-admin/centers", { params }).then((r) => r.data),

  getAllAdmin: (params) =>
    api.get("/admin/centers", { params }).then((r) => r.data),

  create: (data) => api.post("/super-admin/centers", data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/super-admin/centers/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/super-admin/centers/${id}/deactivate`).then((r) => r.data),

  setupDrive: (id) =>
    api.patch(`/super-admin/centers/${id}/setup-drive`).then((r) => r.data),
};

export default centerService;
