import api from "./api";

const adminService = {
  getAll: (params) =>
    api.get("/super-admin/admins", { params }).then((r) => r.data),

  create: (data) => api.post("/super-admin/admins", data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/super-admin/admins/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/super-admin/admins/${id}/deactivate`).then((r) => r.data),
};

export default adminService;
