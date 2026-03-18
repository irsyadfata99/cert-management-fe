// src/utils/exportXlsx.js
// Requires: npm install exceljs
// (replaces deprecated xlsx@0.18.5)

import ExcelJS from "exceljs";

// ── Helpers ───────────────────────────────────────────────────

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

/**
 * Build a Google Drive folder URL from a folder ID.
 * Returns "Not set up" if the ID is null/undefined/empty.
 */
function buildDriveFolderUrl(folderId) {
  if (!folderId) return "Not set up";
  return `https://drive.google.com/drive/folders/${folderId}`;
}

/**
 * Build a workbook with a single sheet, auto-width columns, and a frozen header row.
 * Downloads the file automatically.
 *
 * urlColumns: array of column indices (0-based) that should be rendered as hyperlinks.
 */
async function buildAndDownload(sheetName, headers, rows, filename) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  // Header row
  sheet.addRow(headers);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2EAFF" },
  };
  headerRow.alignment = { vertical: "middle" };

  // Freeze header
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Data rows — URL columns are written as plain text so users can
  // copy-paste into their browser. Excel's built-in hyperlink launcher
  // opens links via IE/WebView which Google blocks as unsupported.
  rows.forEach((rowData) => {
    sheet.addRow(rowData);
  });

  // Auto-width: measure header + data
  headers.forEach((header, colIdx) => {
    const col = sheet.getColumn(colIdx + 1);
    let maxLen = String(header).length + 2;
    rows.forEach((row) => {
      const cellLen = row[colIdx] != null ? String(row[colIdx]).length : 0;
      if (cellLen + 2 > maxLen) maxLen = cellLen + 2;
    });
    col.width = Math.min(maxLen, 60);
  });

  // Stream to buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const UPLOAD_STATUS_LABELS = {
  complete: "Complete",
  report_drafted: "Report Drafted",
  scan_uploaded: "Scan Uploaded",
  printed: "Printed",
  not_started: "Not Started",
};

// ── 1. Upload Status ──────────────────────────────────────────
// Columns:
//   Teacher | Email | Center | Student | Module | Status |
//   Print Cert ID | Reprint Cert IDs | Teacher Drive Folder |
//   Scan Uploaded At | Report Uploaded At
export async function exportUploadStatus(
  rows,
  filename = "upload-status.xlsx",
) {
  const headers = [
    "Teacher",
    "Email",
    "Center",
    "Student",
    "Module",
    "Status",
    "Print Cert ID",
    "Reprint Cert IDs",
    "Teacher Drive Folder",
    "Scan Uploaded At",
    "Report Uploaded At",
  ];

  // Column index 8 (0-based) = "Teacher Drive Folder" — plain text URL, copy-paste to browser

  const data = rows.map((r) => [
    r.teacher_name ?? "",
    r.teacher_email ?? "",
    r.center_name ?? "",
    r.student_name ?? "",
    r.module_name ?? "",
    UPLOAD_STATUS_LABELS[r.upload_status] ?? r.upload_status ?? "",
    r.print_cert_id ?? "",
    r.reprint_cert_ids ?? "",
    buildDriveFolderUrl(r.teacher_drive_folder_id),
    fmtDateTime(r.scan_uploaded_at),
    fmtDateTime(r.report_uploaded_at),
  ]);

  await buildAndDownload("Upload Status", headers, data, filename);
}

// ── 2. Monthly Activity ───────────────────────────────────────
// No cert ID / drive folder applicable here (aggregate data).
export async function exportActivity(rows, filename = "activity.xlsx") {
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

  await buildAndDownload("Monthly Activity", headers, data, filename);
}

// ── 3. Stock Alerts ───────────────────────────────────────────
// No cert ID / drive folder applicable here.
export async function exportStockAlerts(rows, filename = "stock-alerts.xlsx") {
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

  await buildAndDownload("Stock Alerts", headers, data, filename);
}

// ── 4. Reprint Log ────────────────────────────────────────────
// Columns:
//   Teacher | Teacher Email | Student | Module | Center |
//   Reprint Cert ID | Original Cert ID |
//   Teacher Drive Folder |
//   Original Printed At | Reprinted At | PTC Date
export async function exportReprints(rows, filename = "reprint-log.xlsx") {
  const headers = [
    "Teacher",
    "Teacher Email",
    "Student",
    "Module",
    "Center",
    "Reprint Cert ID",
    "Original Cert ID",
    "Teacher Drive Folder",
    "Original Printed At",
    "Reprinted At",
    "PTC Date",
  ];

  // Column index 7 (0-based) = "Teacher Drive Folder" — plain text URL, copy-paste to browser

  const data = rows.map((r) => [
    r.teacher_name ?? "",
    r.teacher_email ?? "",
    r.student_name ?? "",
    r.module_name ?? "",
    r.center_name ?? "",
    r.reprint_cert_unique_id ?? "",
    r.original_cert_unique_id ?? "",
    buildDriveFolderUrl(r.teacher_drive_folder_id),
    fmtDateTime(r.original_printed_at),
    fmtDateTime(r.reprinted_at),
    r.ptc_date ? String(r.ptc_date).split("T")[0] : "",
  ]);

  await buildAndDownload("Reprint Log", headers, data, filename);
}
