import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  Users,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Award,
  FileText,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import DataTable from "@/components/common/DataTable";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import monitoringService from "@/services/monitoringService";
import { formatMonth } from "@/utils/formatDate";
import { toast } from "sonner";

// ── Summary Card ────────────────────────────────────────────
function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  loading,
  delay,
}) {
  if (loading) return <CardSkeleton />;
  return (
    <Card
      className="glass-card border-0 animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {value ?? "—"}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: accent + "20" }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom Chart Tooltip ────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs space-y-1 border border-border shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Centers Table columns ───────────────────────────────────
const centerColumns = [
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
    header: "Teachers",
    accessorKey: "teacher_count",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.teacher_count}</span>
    ),
  },
  {
    header: "Students",
    accessorKey: "student_count",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.student_count}</span>
    ),
  },
  {
    header: "Cert Stock",
    // [FIX] vw_stock_alerts mengembalikan cert_quantity, bukan cert_stock.
    accessorKey: "cert_quantity",
    cell: ({ row }) => {
      const qty = row.original.cert_quantity ?? row.original.cert_stock ?? 0;
      const low = row.original.cert_low_stock;
      return (
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{qty}</span>
          {low && <StatusBadge label="Low" variant="destructive" dot />}
        </div>
      );
    },
  },
  {
    header: "Medal Stock",
    // [FIX] vw_stock_alerts mengembalikan medal_quantity, bukan medal_stock.
    accessorKey: "medal_quantity",
    cell: ({ row }) => {
      const qty = row.original.medal_quantity ?? row.original.medal_stock ?? 0;
      const low = row.original.medal_low_stock;
      return (
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{qty}</span>
          {low && <StatusBadge label="Low" variant="destructive" dot />}
        </div>
      );
    },
  },
];

// ── Upload Status columns ───────────────────────────────────
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
          {row.original.center_name}
        </p>
      </div>
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
      // [FIX] Status valid dari backend vw_enrollment_status:
      //   'complete', 'report_drafted', 'scan_uploaded', 'cert_printed', 'not_started'
      // Status 'partial' dan 'missing' tidak ada di backend — dihapus.
      // Map disesuaikan dengan status aktual yang dikirim API.
      const map = {
        complete: { label: "Complete", variant: "success" },
        report_drafted: { label: "Report Drafted", variant: "info" },
        scan_uploaded: { label: "Scan Uploaded", variant: "info" },
        cert_printed: { label: "Cert Printed", variant: "secondary" },
        not_started: { label: "Not Started", variant: "outline" },
      };
      const s = map[row.original.upload_status] ?? {
        label: row.original.upload_status ?? "—",
        variant: "outline",
      };
      return <StatusBadge label={s.label} variant={s.variant} dot />;
    },
  },
];

// ── Main ────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [centers, setCenters] = useState([]);
  const [activity, setActivity] = useState([]);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [centersRes, activityRes, uploadRes] = await Promise.all([
        monitoringService.getCentersOverview(),
        monitoringService.getSuperActivity(),
        monitoringService.getSuperUploadStatus({ limit: 10 }),
      ]);
      setCenters(centersRes.data ?? []);
      setActivity(activityRes.data ?? []);
      setUploadStatus(uploadRes.data ?? []);
      if (isRefresh) toast.success("Dashboard refreshed");
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const summary = useMemo(
    () => ({
      totalCenters: centers.length,
      totalTeachers: centers.reduce(
        (s, c) => s + Number(c.teacher_count ?? 0),
        0,
      ),
      totalStudents: centers.reduce(
        (s, c) => s + Number(c.student_count ?? 0),
        0,
      ),
      // [FIX] gunakan cert_low_stock dan medal_low_stock dari vw_stock_alerts
      // (field boolean yang sudah dihitung di DB), bukan cert_stock <= cert_threshold
      // yang akan selalu false jika field cert_stock tidak ada (undefined <= number = false)
      lowStockCenters: centers.filter(
        (c) => c.cert_low_stock || c.medal_low_stock,
      ).length,
    }),
    [centers],
  );

  const chartData = useMemo(() => {
    const grouped = {};
    for (const row of activity) {
      const month = formatMonth(row.month);
      if (!grouped[month]) {
        grouped[month] = {
          month,
          cert_printed: 0,
          cert_reprinted: 0,
          medal_issued: 0,
        };
      }
      grouped[month].cert_printed += Number(row.cert_printed ?? 0);
      grouped[month].cert_reprinted += Number(row.cert_reprinted ?? 0);
      grouped[month].medal_issued += Number(row.medal_printed ?? 0);
    }
    return Object.values(grouped).slice(0, 6).reverse();
  }, [activity]);

  // [FIX] uploadSummary sebelumnya menghitung 'partial' dan 'missing' yang
  // tidak ada di backend. Status valid: 'complete', 'report_drafted',
  // 'scan_uploaded', 'cert_printed', 'not_started'.
  //
  // Widget "Upload Status" di sidebar card sekarang menampilkan breakdown
  // berdasarkan status aktual backend, bukan status fiktif.
  // 'complete'         → enrollment sudah selesai penuh
  // 'report_drafted'   → scan sudah diupload, laporan masih draft
  // 'scan_uploaded'    → sertifikat sudah discan, laporan belum dibuat
  // 'cert_printed'     → sertifikat sudah dicetak, scan belum diupload
  // 'not_started'      → enrollment baru, belum ada aksi apapun
  const uploadSummary = useMemo(
    () => ({
      complete: uploadStatus.filter((u) => u.upload_status === "complete")
        .length,
      report_drafted: uploadStatus.filter(
        (u) => u.upload_status === "report_drafted",
      ).length,
      scan_uploaded: uploadStatus.filter(
        (u) => u.upload_status === "scan_uploaded",
      ).length,
      cert_printed: uploadStatus.filter(
        (u) => u.upload_status === "cert_printed",
      ).length,
      not_started: uploadStatus.filter((u) => u.upload_status === "not_started")
        .length,
    }),
    [uploadStatus],
  );

  // Hanya tampilkan status yang count-nya > 0 agar card tidak terlalu panjang
  const uploadSummaryItems = [
    {
      key: "complete",
      label: "Complete",
      color: "hsl(144,79%,50%)",
    },
    {
      key: "report_drafted",
      label: "Report Drafted",
      color: "hsl(219,79%,66%)",
    },
    {
      key: "scan_uploaded",
      label: "Scan Uploaded",
      color: "hsl(38,92%,60%)",
    },
    {
      key: "cert_printed",
      label: "Cert Printed",
      color: "hsl(280,79%,66%)",
    },
    {
      key: "not_started",
      label: "Not Started",
      color: "hsl(0,0%,60%)",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="System overview across all centers."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={Building2}
          label="Total Centers"
          value={summary.totalCenters}
          sub="Active centers"
          accent="hsl(219,79%,66%)"
          loading={loading}
          delay="0ms"
        />
        <SummaryCard
          icon={Users}
          label="Total Teachers"
          value={summary.totalTeachers}
          sub="Across all centers"
          accent="hsl(144,79%,50%)"
          loading={loading}
          delay="50ms"
        />
        <SummaryCard
          icon={GraduationCap}
          label="Total Students"
          value={summary.totalStudents}
          sub="Active students"
          accent="hsl(38,92%,60%)"
          loading={loading}
          delay="100ms"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Stock Alerts"
          value={summary.lowStockCenters}
          sub="Centers with low stock"
          accent="hsl(0,84%,60%)"
          loading={loading}
          delay="150ms"
        />
      </div>

      {/* Chart + Upload Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className="glass-card border-0 lg:col-span-2 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Monthly Activity
                </CardTitle>
                <CardDescription className="text-xs">
                  Certificates & medals issued across all centers
                </CardDescription>
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 skeleton rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No activity data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient
                      id="certGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    <linearGradient
                      id="reprintGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(280,79%,66%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(280,79%,66%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="medalGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="cert_printed"
                    name="Cert Printed"
                    stroke="hsl(219,79%,66%)"
                    fill="url(#certGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="cert_reprinted"
                    name="Cert Reprint"
                    stroke="hsl(280,79%,66%)"
                    fill="url(#reprintGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="medal_issued"
                    name="Medal Issued"
                    stroke="hsl(144,79%,50%)"
                    fill="url(#medalGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card
          className="glass-card border-0 animate-fade-in-up"
          style={{ animationDelay: "250ms" }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Upload Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest 10 enrollments
                </CardDescription>
              </div>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 skeleton rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {uploadSummaryItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="tabular-nums font-semibold"
                    >
                      {uploadSummary[item.key]}
                    </Badge>
                  </div>
                ))}
                <div className="pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Total: {uploadStatus.length} enrollments
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Centers Overview Table */}
      <Card
        className="glass-card border-0 animate-fade-in-up"
        style={{ animationDelay: "300ms" }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Centers Overview
              </CardTitle>
              <CardDescription className="text-xs">
                Stock levels and headcount per center
              </CardDescription>
            </div>
            <Award className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={centerColumns}
            data={centers}
            loading={loading}
            emptyTitle="No centers found"
            emptyDescription="No active centers available."
          />
        </CardContent>
      </Card>

      {/* Upload Status Table */}
      <Card
        className="glass-card border-0 animate-fade-in-up"
        style={{ animationDelay: "350ms" }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Recent Upload Status
              </CardTitle>
              <CardDescription className="text-xs">
                Certificate scan & report upload per enrollment
              </CardDescription>
            </div>
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={uploadColumns}
            data={uploadStatus}
            loading={loading}
            emptyTitle="No upload data"
            emptyDescription="No enrollment upload data available."
          />
        </CardContent>
      </Card>
    </div>
  );
}
