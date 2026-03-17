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

  getActivity: () => api.get("/teacher/activity").then((r) => r.data),

  // Import
  downloadTemplate: () =>
    api.get("/admin/teachers/template", { responseType: "blob" }).then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "teachers_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }),

  importExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/admin/teachers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export default teacherService;
