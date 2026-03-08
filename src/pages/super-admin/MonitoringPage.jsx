import { useEffect, useState, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  TrendingUp,
  Upload,
  RefreshCw,
  Award,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import monitoringService from "@/services/monitoringService";
import centerService from "@/services/centerService";
import { formatMonth } from "@/utils/formatDate";
import { toast } from "sonner";
import usePagination from "@/hooks/usePagination";

// ── Custom Tooltip ──────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg p-3 text-xs space-y-1 shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Upload status columns ───────────────────────────────────
const uploadColumns = [
  {
    header: "Teacher",
    accessorKey: "teacher_name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground text-sm">
          {row.original.teacher_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.original.teacher_email}
        </p>
      </div>
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
    header: "Student",
    accessorKey: "student_name",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.student_name}</span>
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
    header: "Status",
    accessorKey: "upload_status",
    cell: ({ row }) => {
      const map = {
        complete: { label: "Complete", variant: "success" },
        report_drafted: { label: "Report Drafted", variant: "info" },
        scan_uploaded: { label: "Scan Uploaded", variant: "info" },
        printed: { label: "Printed", variant: "secondary" },
        not_started: { label: "Not Started", variant: "outline" },
      };
      const s = map[row.original.upload_status] ?? {
        label: row.original.upload_status,
        variant: "outline",
      };
      return <StatusBadge label={s.label} variant={s.variant} dot />;
    },
  },
];

// ── Stock alert columns ─────────────────────────────────────
const stockColumns = [
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
    header: "Cert Stock",
    accessorKey: "cert_quantity",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="tabular-nums">{row.original.cert_quantity}</span>
        {row.original.cert_low_stock && (
          <StatusBadge label="Low" variant="destructive" dot />
        )}
      </div>
    ),
  },
  {
    header: "Cert Threshold",
    accessorKey: "cert_threshold",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.cert_threshold}
      </span>
    ),
  },
  {
    header: "Medal Stock",
    accessorKey: "medal_quantity",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="tabular-nums">{row.original.medal_quantity}</span>
        {row.original.medal_low_stock && (
          <StatusBadge label="Low" variant="destructive" dot />
        )}
      </div>
    ),
  },
  {
    header: "Medal Threshold",
    accessorKey: "medal_threshold",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.medal_threshold}
      </span>
    ),
  },
];

// ── Main Page ───────────────────────────────────────────────
export default function SuperAdminMonitoringPage() {
  const [centers, setCenters] = useState([]);

  // Filters
  const [selectedCenter, setSelectedCenter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Data
  const [uploadData, setUploadData] = useState([]);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [activityData, setActivityData] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);

  // Loading states
  const [uploadLoading, setUploadLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { page, limit, goToPage, reset } = usePagination(10);

  // Load centers for filter
  useEffect(() => {
    centerService
      .getAll({ limit: 100, is_active: true })
      .then((res) => setCenters(res.data ?? []))
      .catch(() => {});
  }, []);

  // Reset page on filter change
  useEffect(() => {
    reset();
  }, [selectedCenter, selectedStatus, reset]);

  const fetchUpload = useCallback(async () => {
    setUploadLoading(true);
    try {
      const res = await monitoringService.getSuperUploadStatus({
        page,
        limit,
        center_id: selectedCenter !== "all" ? selectedCenter : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      });
      setUploadData(res.data ?? []);
      setUploadTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load upload status");
    } finally {
      setUploadLoading(false);
    }
  }, [page, limit, selectedCenter, selectedStatus]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await monitoringService.getSuperActivity({
        center_id: selectedCenter !== "all" ? selectedCenter : undefined,
      });
      setActivityData(res.data ?? []);
    } catch {
      toast.error("Failed to load activity data");
    } finally {
      setActivityLoading(false);
    }
  }, [selectedCenter]);

  const fetchStock = useCallback(async () => {
    setStockLoading(true);
    try {
      const res = await monitoringService.getSuperStockAlerts();
      setStockAlerts(res.data ?? []);
    } catch {
      toast.error("Failed to load stock alerts");
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpload();
  }, [fetchUpload]);
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);
  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUpload(), fetchActivity(), fetchStock()]);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  // Chart data — group by month, sum across centers
  const chartData = useMemo(() => {
    const grouped = {};
    for (const row of activityData) {
      const month = formatMonth(row.month);
      if (!grouped[month]) {
        grouped[month] = {
          month,
          cert_printed: 0,
          medal_printed: 0,
          cert_scan_uploaded: 0,
        };
      }
      grouped[month].cert_printed += Number(row.cert_printed ?? 0);
      grouped[month].medal_printed += Number(row.medal_printed ?? 0);
      grouped[month].cert_scan_uploaded += Number(row.cert_scan_uploaded ?? 0);
    }
    return Object.values(grouped).slice(0, 12).reverse();
  }, [activityData]);

  const totalPages = Math.ceil(uploadTotal / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        description="Track upload status, activity, and stock levels across all centers."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedCenter} onValueChange={setSelectedCenter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Centers" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All Centers</SelectItem>
            {centers.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All Statuses</SelectItem>
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
      </div>

      {/* ── Activity Chart ── */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Monthly Activity
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedCenter !== "all"
                  ? `Filtered by: ${centers.find((c) => String(c.id) === selectedCenter)?.name}`
                  : "All centers combined"}
              </CardDescription>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="h-52 skeleton rounded-lg" />
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
              No activity data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="certGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(219,79%,66%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(219,79%,66%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="medalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(144,79%,50%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(144,79%,50%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(38,92%,60%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(38,92%,60%)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="cert_printed"
                  name="Cert Printed"
                  stroke="hsl(219,79%,66%)"
                  fill="url(#certGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="medal_printed"
                  name="Medal Printed"
                  stroke="hsl(144,79%,50%)"
                  fill="url(#medalGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cert_scan_uploaded"
                  name="Scan Uploaded"
                  stroke="hsl(38,92%,60%)"
                  fill="url(#scanGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Upload Status Table ── */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Upload Status
              </CardTitle>
              <CardDescription className="text-xs">
                Certificate scan & report upload per enrollment
              </CardDescription>
            </div>
            <Upload className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={uploadColumns}
            data={uploadData}
            loading={uploadLoading}
            emptyTitle="No enrollments found"
            emptyDescription="Try adjusting the filters."
          />
        </CardContent>
        {totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}
      </Card>

      {/* ── Stock Alerts ── */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Stock Alerts
              </CardTitle>
              <CardDescription className="text-xs">
                Centers with stock below threshold
              </CardDescription>
            </div>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={stockColumns}
            data={stockAlerts}
            loading={stockLoading}
            emptyTitle="No stock alerts"
            emptyDescription="All centers have sufficient stock."
          />
        </CardContent>
      </Card>
    </div>
  );
}
