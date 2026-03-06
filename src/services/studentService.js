import api from "./api";

const studentService = {
  getAll: (params) =>
    api.get("/admin/students", { params }).then((r) => r.data),

  getById: (id) => api.get(`/admin/students/${id}`).then((r) => r.data),

  create: (data) => api.post("/admin/students", data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/admin/students/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/admin/students/${id}/deactivate`).then((r) => r.data),
};

export default studentService;
