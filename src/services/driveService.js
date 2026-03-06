import api from "./api";

const driveService = {
  // ── Stock (admin & super_admin) ──
  getStock: () => api.get("/drive/stock").then((r) => r.data),

  addStock: (data) => api.post("/drive/stock/add", data).then((r) => r.data),

  transferStock: (data) =>
    api.post("/drive/stock/transfer", data).then((r) => r.data),

  updateThreshold: (data) =>
    api.patch("/drive/stock/threshold", data).then((r) => r.data),

  // ── Teacher: stock info ──
  getTeacherStock: () => api.get("/teacher/stock").then((r) => r.data),

  // ── Certificates ──
  uploadScan: (certId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post(`/drive/certificates/${certId}/scan`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  // ── Reports ──
  uploadReport: (reportId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post(`/drive/reports/${reportId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export default driveService;
