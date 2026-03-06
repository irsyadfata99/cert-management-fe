// ============================================================
// FORMAT STATUS
// Returns: { label, variant }
// variant aligns with shadcn Badge: "default" | "secondary" |
//   "destructive" | "outline"
// Custom variants: "success" | "warning" | "info"
// ============================================================

/**
 * Enrollment status
 * Values from backend (vw_enrollment_status):
 *   "pending" | "cert_printed" | "scan_uploaded" | "report_uploaded" | "complete"
 */
export const formatEnrollmentStatus = (status) => {
  const map = {
    pending: { label: "Pending", variant: "outline" },
    cert_printed: { label: "Certificate Printed", variant: "secondary" },
    scan_uploaded: { label: "Scan Uploaded", variant: "info" },
    report_uploaded: { label: "Report Uploaded", variant: "info" },
    complete: { label: "Complete", variant: "success" },
  };
  return map[status] ?? { label: status ?? "-", variant: "outline" };
};

/**
 * Upload status (vw_teacher_upload_status)
 * Values: "complete" | "partial" | "missing"
 */
export const formatUploadStatus = (status) => {
  const map = {
    complete: { label: "Complete", variant: "success" },
    partial: { label: "Partial", variant: "warning" },
    missing: { label: "Missing", variant: "destructive" },
  };
  return map[status] ?? { label: status ?? "-", variant: "outline" };
};

/**
 * Active / Inactive — for user, student, module, center
 * @param {boolean} isActive
 */
export const formatActiveStatus = (isActive) => {
  return isActive
    ? { label: "Active", variant: "success" }
    : { label: "Inactive", variant: "outline" };
};

/**
 * Stock alert
 * @param {boolean} isLowStock
 */
export const formatStockAlert = (isLowStock) => {
  return isLowStock
    ? { label: "Low Stock", variant: "destructive" }
    : { label: "Normal", variant: "success" };
};

/**
 * Boolean scan / report upload (true = uploaded, false = not yet)
 * @param {boolean} uploaded
 */
export const formatUploadBoolean = (uploaded) => {
  return uploaded
    ? { label: "Uploaded", variant: "success" }
    : { label: "Not Yet", variant: "outline" };
};
