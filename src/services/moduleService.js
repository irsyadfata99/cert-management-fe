import api from "./api";

const moduleService = {
  getAll: (params) => api.get("/admin/modules", { params }).then((r) => r.data),

  create: (data) => api.post("/admin/modules", data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/admin/modules/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/admin/modules/${id}/deactivate`).then((r) => r.data),
};

export default moduleService;
