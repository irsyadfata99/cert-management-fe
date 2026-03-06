import api from "./api";

const teacherActionService = {
  // ── Enrollments ──
  getEnrollments: (params) =>
    api.get("/teacher/enrollments", { params }).then((r) => r.data),

  // ── Certificates ──
  getCertificates: (params) =>
    api.get("/teacher/certificates", { params }).then((r) => r.data),

  printCert: (data) =>
    api.post("/teacher/certificates/print", data).then((r) => r.data),

  printCertBatch: (data) =>
    api.post("/teacher/certificates/print/batch", data).then((r) => r.data),

  reprintCert: (data) =>
    api.post("/teacher/certificates/reprint", data).then((r) => r.data),

  // ── Medals ──
  getMedals: (params) =>
    api.get("/teacher/medals", { params }).then((r) => r.data),

  printMedal: (data) =>
    api.post("/teacher/medals/print", data).then((r) => r.data),

  printMedalBatch: (data) =>
    api.post("/teacher/medals/print/batch", data).then((r) => r.data),

  // ── Reports ──
  getReports: (params) =>
    api.get("/teacher/reports", { params }).then((r) => r.data),

  createReport: (data) =>
    api.post("/teacher/reports", data).then((r) => r.data),

  updateReport: (id, data) =>
    api.patch(`/teacher/reports/${id}`, data).then((r) => r.data),
};

export default teacherActionService;
