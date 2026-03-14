import api from "./api";

const monitoringService = {
  // ── Super Admin ──
  getCentersOverview: () =>
    api.get("/super-admin/monitoring/centers").then((r) => r.data),

  getSuperUploadStatus: (params) =>
    api
      .get("/super-admin/monitoring/upload-status", { params })
      .then((r) => r.data),

  getSuperActivity: (params) =>
    api.get("/super-admin/monitoring/activity", { params }).then((r) => r.data),

  getSuperStockAlerts: () =>
    api.get("/super-admin/monitoring/stock-alerts").then((r) => r.data),

  // ── [NEW] Reprint log ──
  getSuperReprints: (params) =>
    api.get("/super-admin/monitoring/reprints", { params }).then((r) => r.data),

  downloadEnrollments: (params) =>
    api
      .get("/super-admin/download/enrollments", {
        params,
        responseType: "blob",
      })
      .then((r) => r.data),

  // ── Admin ──
  getAdminUploadStatus: (params) =>
    api.get("/admin/monitoring/upload-status", { params }).then((r) => r.data),

  getAdminActivity: (params) =>
    api.get("/admin/monitoring/activity", { params }).then((r) => r.data),

  getAdminStockAlerts: () =>
    api.get("/admin/monitoring/stock-alerts").then((r) => r.data),
};

export default monitoringService;
