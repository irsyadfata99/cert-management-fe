import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Upload,
  BarChart3,
  Package,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import DataTable from "@/components/common/DataTable";
import Pagination from "@/components/common/Pagination";
import api from "@/services/api";
import { formatDate } from "@/utils/formatDate";
import {
  exportUploadStatus,
  exportActivity,
  exportStockAlerts,
} from "@/utils/exportXlsx";
import { toast } from "sonner";
import usePagination from "@/hooks/usePagination";
import { cn } from "@/lib/utils";

// ── Service ──────────────────────────────────────────────────
const monitoringService = {
  getUploadStatus: (params) =>
    api.get("/admin/monitoring/upload-status", { params }).then((r) => r.data),
  getActivity: (params) =>
    api.get("/admin/monitoring/activity", { params }).then((r) => r.data),
  getStockAlerts: () =>
    api.get("/admin/monitoring/stock-alerts").then((r) => r.data),
};

// ── Upload Status badge helper ────────────────────────────────
const UPLOAD_STATUS_MAP = {
  not_started: { label: "Not Started", variant: "outline" },
  printed: { label: "Printed", variant: "warning" },
  scan_uploaded: { label: "Scan Uploaded", variant: "info" },
  report_drafted: { label: "Report Drafted", variant: "secondary" },
  complete: { label: "Complete", variant: "success" },
};

// ── Section Header ────────────────────────────────────────────
function SectionHeader({ icon: IconComponent, title, description }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <IconComponent className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

// ── Stock Alert Card ──────────────────────────────────────────
function StockAlertCard({ item }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {item.center_name}
        </p>
        {item.has_alert && (
          <StatusBadge label="Low Stock" variant="destructive" dot />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Certificate */}
        <div
          className={cn(
            "rounded-md border p-3 space-y-1",
            item.cert_low_stock
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-background/50",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Certificate
            </p>
            {item.cert_low_stock && (
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            )}
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {item.cert_quantity}
          </p>
          <p className="text-xs text-muted-foreground">
            Threshold: {item.cert_threshold}
          </p>
        </div>
        {/* Medal */}
        <div
          className={cn(
            "rounded-md border p-3 space-y-1",
            item.medal_low_stock
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-background/50",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Medal
            </p>
            {item.medal_low_stock && (
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            )}
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {item.medal_quantity}
          </p>
          <p className="text-xs text-muted-foreground">
            Threshold: {item.medal_threshold}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function AdminMonitoringPage() {
  // ── Upload Status ──
  const [uploadData, setUploadData] = useState([]);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(true);
  const [uploadStatusFilter, setUploadStatusFilter] = useState("all");
  const {
    page: uploadPage,
    limit: uploadLimit,
    goToPage: goToUploadPage,
    reset: resetUpload,
  } = usePagination(10);

  // ── Activity ──
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const {
    page: actPage,
    limit: actLimit,
    goToPage: goToActPage,
  } = usePagination(10);

  // ── Stock Alerts ──
  const [stockData, setStockData] = useState([]);
  const [stockLoading, setStockLoading] = useState(true);

  // ── Fetch Upload Status ──
  const fetchUploadStatus = useCallback(async () => {
    setUploadLoading(true);
    try {
      const res = await monitoringService.getUploadStatus({
        page: uploadPage,
        limit: uploadLimit,
        status: uploadStatusFilter !== "all" ? uploadStatusFilter : undefined,
      });
      setUploadData(res.data ?? []);
      setUploadTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load upload status");
    } finally {
      setUploadLoading(false);
    }
  }, [uploadPage, uploadLimit, uploadStatusFilter]);

  // ── Fetch Activity ──
  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await monitoringService.getActivity();
      setActivityData(res.data ?? []);
    } catch {
      toast.error("Failed to load activity data");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // ── Fetch Stock Alerts ──
  const fetchStockAlerts = useCallback(async () => {
    setStockLoading(true);
    try {
      const res = await monitoringService.getStockAlerts();
      setStockData(res.data ?? []);
    } catch {
      toast.error("Failed to load stock alerts");
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploadStatus();
  }, [fetchUploadStatus]);
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);
  useEffect(() => {
    fetchStockAlerts();
  }, [fetchStockAlerts]);

  useEffect(() => {
    resetUpload();
  }, [uploadStatusFilter, resetUpload]);

  // ── Upload Status Columns ──
  const uploadColumns = [
    {
      header: "Teacher",
      accessorKey: "teacher_name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">
            {row.original.teacher_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.teacher_email}
          </p>
        </div>
      ),
    },
    {
      header: "Student",
      accessorKey: "student_name",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.student_name}
        </span>
      ),
    },
    {
      header: "Module",
      accessorKey: "module_name",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.module_name}
        </span>
      ),
    },
    {
      header: "Center",
      accessorKey: "center_name",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.center_name}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "upload_status",
      cell: ({ row }) => {
        const s = UPLOAD_STATUS_MAP[row.original.upload_status] ?? {
          label: row.original.upload_status,
          variant: "outline",
        };
        return <StatusBadge label={s.label} variant={s.variant} dot />;
      },
    },
    {
      header: "Scan Uploaded",
      accessorKey: "scan_uploaded_at",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.scan_uploaded_at
            ? formatDate(row.original.scan_uploaded_at)
            : "—"}
        </span>
      ),
    },
    {
      header: "Report Uploaded",
      accessorKey: "report_uploaded_at",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.report_uploaded_at
            ? formatDate(row.original.report_uploaded_at)
            : "—"}
        </span>
      ),
    },
  ];

  // ── Activity Columns ──
  const activityColumns = [
    {
      header: "Center",
      accessorKey: "center_name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.center_name}
        </span>
      ),
    },
    {
      header: "Month",
      accessorKey: "month",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.month
            ? new Date(row.original.month).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "—"}
        </span>
      ),
    },
    {
      header: "Cert Printed",
      accessorKey: "cert_printed",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.cert_printed ?? 0}
        </span>
      ),
    },
    {
      header: "Cert Reprint",
      accessorKey: "cert_reprinted",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.cert_reprinted ?? 0}
        </span>
      ),
    },
    {
      header: "Scan Uploaded",
      accessorKey: "cert_scan_uploaded",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.cert_scan_uploaded ?? 0}
        </span>
      ),
    },
    {
      header: "Medal Issued",
      accessorKey: "medal_issued",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.medal_printed ?? 0}
        </span>
      ),
    },
    {
      header: "Total Issued",
      accessorKey: "total_issued",
      cell: ({ row }) => (
        <span className="text-sm font-semibold tabular-nums">
          {row.original.total_issued ?? 0}
        </span>
      ),
    },
  ];

  // Paginate activity client-side (backend returns max 120 rows)
  const activityPaged = activityData.slice(
    (actPage - 1) * actLimit,
    actPage * actLimit,
  );
  const activityTotalPages = Math.ceil(activityData.length / actLimit);
  const uploadTotalPages = Math.ceil(uploadTotal / uploadLimit);

  // Stock alert counts
  const alertCount = stockData.filter((s) => s.has_alert).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitoring"
        description="Track upload progress, monthly activity, and stock levels."
      />

      {/* ── Stock Alerts ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={Package}
            title="Stock Alerts"
            description="Current inventory levels across all centers"
          />
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <StatusBadge
                label={`${alertCount} center${alertCount !== 1 ? "s" : ""} low on stock`}
                variant="destructive"
                dot
              />
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={stockData.length === 0}
              onClick={() => exportStockAlerts(stockData)}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {stockLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-lg border border-border bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : stockData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No stock data available.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockData.map((item) => (
              <StockAlertCard key={item.center_id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* ── Upload Status ── */}
      <section>
        <SectionHeader
          icon={Upload}
          title="Upload Status"
          description="Teacher document upload progress per enrollment"
        />
        <div className="flex items-center gap-3 mb-4">
          <Select
            value={uploadStatusFilter}
            onValueChange={setUploadStatusFilter}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="printed">Printed</SelectItem>
              <SelectItem value="scan_uploaded">Scan Uploaded</SelectItem>
              <SelectItem value="report_drafted">Report Drafted</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
          {uploadTotal > 0 && (
            <span className="text-xs text-muted-foreground">
              {uploadTotal} enrollment{uploadTotal !== 1 ? "s" : ""}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={uploadData.length === 0}
            onClick={() => exportUploadStatus(uploadData)}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
        <DataTable
          columns={uploadColumns}
          data={uploadData}
          loading={uploadLoading}
          emptyTitle="No upload data found"
          emptyDescription="Try adjusting the status filter."
        />
        <div className="mt-3">
          <Pagination
            page={uploadPage}
            totalPages={uploadTotalPages}
            onPageChange={goToUploadPage}
          />
        </div>
      </section>

      {/* ── Monthly Activity ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={BarChart3}
            title="Monthly Activity"
            description="Certificate and medal activity per center per month"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={activityData.length === 0}
            onClick={() => exportActivity(activityData)}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
        <DataTable
          columns={activityColumns}
          data={activityPaged}
          loading={activityLoading}
          emptyTitle="No activity data found"
          emptyDescription="Activity data will appear once certificates are issued."
        />
        <div className="mt-3">
          <Pagination
            page={actPage}
            totalPages={activityTotalPages}
            onPageChange={goToActPage}
          />
        </div>
      </section>
    </div>
  );
}
