// src/utils/exportXlsx.js
// Requires: npm install xlsx
//
// Penggunaan di komponen:
//   import { exportUploadStatus, exportActivity, exportStockAlerts } from "@/utils/exportXlsx";

import * as XLSX from "xlsx";

// ── Helpers ───────────────────────────────────────────────────

function autoWidth(ws, rows, headers) {
  const colWidths = headers.map((h) => ({
    wch: Math.max(h.length + 2, 12),
  }));
  rows.forEach((row) => {
    row.forEach((cell, ci) => {
      const len = cell == null ? 0 : String(cell).length;
      if (len + 2 > colWidths[ci].wch) colWidths[ci].wch = len + 2;
    });
  });
  ws["!cols"] = colWidths;
}

function fmtDateTime(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtMonth(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleString("en-GB", { month: "short", year: "numeric" });
}

function buildWorkbook(sheetName, headers, data) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  autoWidth(ws, data, headers);
  // Freeze baris pertama (header)
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

const UPLOAD_STATUS_LABELS = {
  complete: "Complete",
  report_drafted: "Report Drafted",
  scan_uploaded: "Scan Uploaded",
  printed: "Printed",
  not_started: "Not Started",
};

// ── 1. Upload Status ──────────────────────────────────────────
export function exportUploadStatus(rows, filename = "upload-status.xlsx") {
  const headers = [
    "Teacher",
    "Email",
    "Center",
    "Student",
    "Module",
    "Status",
    "Scan Uploaded At",
    "Report Uploaded At",
  ];

  const data = rows.map((r) => [
    r.teacher_name ?? "",
    r.teacher_email ?? "",
    r.center_name ?? "",
    r.student_name ?? "",
    r.module_name ?? "",
    UPLOAD_STATUS_LABELS[r.upload_status] ?? r.upload_status ?? "",
    fmtDateTime(r.scan_uploaded_at),
    fmtDateTime(r.report_uploaded_at),
  ]);

  const wb = buildWorkbook("Upload Status", headers, data);
  XLSX.writeFile(wb, filename);
}

// ── 2. Monthly Activity ───────────────────────────────────────
export function exportActivity(rows, filename = "activity.xlsx") {
  const headers = [
    "Center",
    "Month",
    "Cert Printed",
    "Cert Reprinted",
    "Scan Uploaded",
    "Medal Printed",
    "Total Issued",
  ];

  const data = rows.map((r) => [
    r.center_name ?? "",
    fmtMonth(r.month),
    Number(r.cert_printed ?? 0),
    Number(r.cert_reprinted ?? 0),
    Number(r.cert_scan_uploaded ?? 0),
    Number(r.medal_printed ?? 0),
    Number(r.total_issued ?? 0),
  ]);

  const wb = buildWorkbook("Monthly Activity", headers, data);
  XLSX.writeFile(wb, filename);
}

// ── 3. Stock Alerts ───────────────────────────────────────────
export function exportStockAlerts(rows, filename = "stock-alerts.xlsx") {
  const headers = [
    "Center",
    "Cert Qty",
    "Cert Threshold",
    "Cert Low Stock",
    "Medal Qty",
    "Medal Threshold",
    "Medal Low Stock",
  ];

  const data = rows.map((r) => [
    r.center_name ?? "",
    Number(r.cert_quantity ?? 0),
    Number(r.cert_threshold ?? 0),
    r.cert_low_stock ? "Low" : "OK",
    Number(r.medal_quantity ?? 0),
    Number(r.medal_threshold ?? 0),
    r.medal_low_stock ? "Low" : "OK",
  ]);

  const wb = buildWorkbook("Stock Alerts", headers, data);
  XLSX.writeFile(wb, filename);
}
