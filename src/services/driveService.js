import api from "./api";

const driveService = {
  // ── Stock Overview (admin & super_admin) ──
  getStock: () => api.get("/drive/stock").then((r) => r.data),

  // Get all centers stock — accessible by admin & super_admin
  getAdminStock: () => api.get("/admin/stock").then((r) => r.data),

  // ── Certificate Batch ──
  getCertificateBatch: (centerId) =>
    api.get(`/drive/stock/batch/${centerId}`).then((r) => r.data),

  addCertificateBatch: (data) =>
    api.post("/drive/stock/certificate/add", data).then((r) => r.data),

  transferCertificateBatch: (data) =>
    api.post("/drive/stock/certificate/transfer", data).then((r) => r.data),

  previewCertificateTransfer: (params) =>
    api
      .get("/drive/stock/certificate/transfer/preview", { params })
      .then((r) => r.data),

  // ── Medal Stock ──
  addMedalStock: (data) =>
    api.post("/drive/stock/medal/add", data).then((r) => r.data),

  transferMedalStock: (data) =>
    api.post("/drive/stock/medal/transfer", data).then((r) => r.data),

  // ── Threshold ──
  updateThreshold: (data) =>
    api.patch("/drive/stock/threshold", data).then((r) => r.data),

  // ── Teacher: stock info ──
  getTeacherStock: () => api.get("/teacher/stock").then((r) => r.data),

  // ── Certificates ──
  // isReprint: if true, appends _REPRINT to the filename before extension
  uploadScan: (certId, file, isReprint = false) => {
    const formData = new FormData();
    formData.append("file", file);
    if (isReprint) {
      formData.append("is_reprint", "true");
    }
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

  downloadReport: (reportId) =>
    api
      .get(`/drive/reports/${reportId}/download`, { responseType: "blob" })
      .then((r) => r.data),
};

export default driveService;
