import api from "./api";

const enrollmentService = {
  getAll: (params) =>
    api.get("/admin/enrollments", { params }).then((r) => r.data),

  create: (data) => api.post("/admin/enrollments", data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/admin/enrollments/${id}/deactivate`).then((r) => r.data),

  getPairStatus: (id) =>
    api.get(`/admin/enrollments/${id}/pair-status`).then((r) => r.data),
};

export default enrollmentService;
