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

  // Import
  downloadTemplate: () =>
    api.get("/admin/students/template", { responseType: "blob" }).then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "students_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }),

  importExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/admin/students/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export default studentService;
