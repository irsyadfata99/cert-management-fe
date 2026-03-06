import api from "./api";

const teacherService = {
  getAll: (params) =>
    api.get("/admin/teachers", { params }).then((r) => r.data),

  create: (data) => api.post("/admin/teachers", data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/admin/teachers/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/admin/teachers/${id}/deactivate`).then((r) => r.data),

  // Centers
  getCenters: (id) =>
    api.get(`/admin/teachers/${id}/centers`).then((r) => r.data),

  assignCenter: (id, data) =>
    api.post(`/admin/teachers/${id}/centers`, data).then((r) => r.data),

  removeCenter: (id, centerId) =>
    api.delete(`/admin/teachers/${id}/centers/${centerId}`).then((r) => r.data),
};

export default teacherService;
