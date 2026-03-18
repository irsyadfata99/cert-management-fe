export const formatEnrollmentStatus = (status) => {
  const map = {
    pending: { label: "Pending", variant: "outline" },
    cert_printed: { label: "Cert Printed", variant: "secondary" },
    scan_uploaded: { label: "Scan Uploaded", variant: "info" },
    report_drafted: { label: "Report Drafted", variant: "warning" },
    complete: { label: "Complete", variant: "success" },
  };
  return map[status] ?? { label: status ?? "-", variant: "outline" };
};

export const formatUploadStatus = (status) => {
  const map = {
    complete: { label: "Complete", variant: "success" },
    report_drafted: { label: "Report Drafted", variant: "info" },
    scan_uploaded: { label: "Scan Uploaded", variant: "info" },
    cert_printed: { label: "Cert Printed", variant: "secondary" },
    not_started: { label: "Not Started", variant: "outline" },
  };
  return map[status] ?? { label: status ?? "-", variant: "outline" };
};

export const formatActiveStatus = (isActive) => {
  return isActive
    ? { label: "Active", variant: "success" }
    : { label: "Inactive", variant: "outline" };
};

export const formatStockAlert = (isLowStock) => {
  return isLowStock
    ? { label: "Low Stock", variant: "destructive" }
    : { label: "Normal", variant: "success" };
};

export const formatUploadBoolean = (uploaded) => {
  return uploaded
    ? { label: "Uploaded", variant: "success" }
    : { label: "Not Yet", variant: "outline" };
};
