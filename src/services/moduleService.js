import api from "./api";

const moduleService = {
  getAll: (params) => api.get("/admin/modules", { params }).then((r) => r.data),

  create: (data) => api.post("/admin/modules", data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/admin/modules/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/admin/modules/${id}/deactivate`).then((r) => r.data),

  downloadTemplate: () =>
    api.get("/admin/modules/template", { responseType: "blob" }).then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modules_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }),

  importExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/admin/modules/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export default moduleService;
