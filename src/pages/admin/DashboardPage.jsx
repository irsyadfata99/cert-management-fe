import { useEffect, useState, useMemo } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  RefreshCw,
  FileText,
  Award,
  AlertTriangle,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import monitoringService from "@/services/monitoringService";
import studentService from "@/services/studentService";
import teacherService from "@/services/teacherService";
import enrollmentService from "@/services/enrollmentService";
import moduleService from "@/services/moduleService";
import driveService from "@/services/driveService";
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

// ── Stock Card (per center) ─────────────────────────────────
function StockCard({ s, delay }) {
  const hasAlert = s.cert_low_stock || s.medal_low_stock;

  return (
    <Card
      className="glass-card border-0 animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {s.center_name}
          </CardTitle>
          {hasAlert && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="w-3 h-3" />
              Low Stock
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {/* Cert Stock */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Award
              className="w-4 h-4"
              style={{
                color: s.cert_low_stock ? "hsl(0,84%,60%)" : "hsl(144,79%,50%)",
              }}
            />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cert Stock
            </p>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {s.cert_quantity}
          </p>
          <p className="text-xs text-muted-foreground">
            Threshold: {s.cert_threshold}
          </p>
          {s.cert_low_stock && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Low stock
            </p>
          )}
        </div>

        {/* Medal Stock */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Award
              className="w-4 h-4"
              style={{
                color: s.medal_low_stock ? "hsl(0,84%,60%)" : "hsl(38,92%,60%)",
              }}
            />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Medal Stock
            </p>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {s.medal_quantity}
          </p>
          <p className="text-xs text-muted-foreground">
            Threshold: {s.medal_threshold}
          </p>
          {s.medal_low_stock && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Low stock
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom Chart Tooltip ────────────────────────────────────
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

// ── Main Page ───────────────────────────────────────────────
export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    enrollments: 0,
    modules: 0,
  });
  const [activity, setActivity] = useState([]);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        studentsRes,
        teachersRes,
        enrollmentsRes,
        modulesRes,
        activityRes,
        uploadRes,
        stockRes,
      ] = await Promise.all([
        studentService.getAll({ limit: 1 }),
        teacherService.getAll({ limit: 1 }),
        enrollmentService.getAll({ limit: 1 }),
        moduleService.getAll({ limit: 1 }),
        monitoringService.getAdminActivity(),
        monitoringService.getAdminUploadStatus({ limit: 100 }),
        driveService.getStock(),
      ]);

      setCounts({
        students: studentsRes.pagination?.total ?? 0,
        teachers: teachersRes.pagination?.total ?? 0,
        enrollments: enrollmentsRes.pagination?.total ?? 0,
        modules: modulesRes.pagination?.total ?? 0,
      });
      setActivity(activityRes.data ?? []);
      setUploadStatus(uploadRes.data ?? []);
      setStock(stockRes.data ?? null);

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

  // Chart data
  const chartData = useMemo(() => {
    const grouped = {};
    for (const row of activity) {
      const month = formatMonth(row.month);
      if (!grouped[month])
        grouped[month] = {
          month,
          cert_printed: 0,
          medal_printed: 0,
          cert_scan_uploaded: 0,
        };
      grouped[month].cert_printed += Number(row.cert_printed ?? 0);
      grouped[month].medal_printed += Number(row.medal_printed ?? 0);
      grouped[month].cert_scan_uploaded += Number(row.cert_scan_uploaded ?? 0);
    }
    return Object.values(grouped).slice(0, 6).reverse();
  }, [activity]);

  // Upload summary
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
      printed: uploadStatus.filter((u) => u.upload_status === "printed").length,
      not_started: uploadStatus.filter((u) => u.upload_status === "not_started")
        .length,
    }),
    [uploadStatus],
  );

  // Stock — handle both single object and array
  const stockList = useMemo(() => {
    if (!stock) return [];
    return Array.isArray(stock) ? stock : [stock];
  }, [stock]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your center's activity."
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
          icon={GraduationCap}
          label="Students"
          value={counts.students}
          sub="Active students"
          accent="hsl(219,79%,66%)"
          loading={loading}
          delay="0ms"
        />
        <SummaryCard
          icon={Users}
          label="Teachers"
          value={counts.teachers}
          sub="Active teachers"
          accent="hsl(144,79%,50%)"
          loading={loading}
          delay="50ms"
        />
        <SummaryCard
          icon={FileText}
          label="Enrollments"
          value={counts.enrollments}
          sub="Active enrollments"
          accent="hsl(38,92%,60%)"
          loading={loading}
          delay="100ms"
        />
        <SummaryCard
          icon={BookOpen}
          label="Modules"
          value={counts.modules}
          sub="Available modules"
          accent="hsl(280,79%,66%)"
          loading={loading}
          delay="150ms"
        />
      </div>

      {/* Chart + Upload Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Chart */}
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
                  Certificates & medals issued this center
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
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Upload Summary */}
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
                  All enrollments
                </CardDescription>
              </div>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-9 skeleton rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {[
                  {
                    label: "Complete",
                    value: uploadSummary.complete,
                    color: "hsl(144,79%,50%)",
                  },
                  {
                    label: "Report Drafted",
                    value: uploadSummary.report_drafted,
                    color: "hsl(219,79%,66%)",
                  },
                  {
                    label: "Scan Uploaded",
                    value: uploadSummary.scan_uploaded,
                    color: "hsl(38,92%,60%)",
                  },
                  {
                    label: "Printed",
                    value: uploadSummary.printed,
                    color: "hsl(280,79%,66%)",
                  },
                  {
                    label: "Not Started",
                    value: uploadSummary.not_started,
                    color: "hsl(var(--muted-foreground))",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: item.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="tabular-nums font-semibold text-xs"
                    >
                      {item.value}
                    </Badge>
                  </div>
                ))}
                <div className="pt-1 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Total:{" "}
                    {Object.values(uploadSummary).reduce((a, b) => a + b, 0)}{" "}
                    enrollments
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Info */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        stockList.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Stock Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockList.map((s, idx) => (
                <StockCard
                  key={s.center_id}
                  s={s}
                  delay={`${300 + idx * 50}ms`}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
