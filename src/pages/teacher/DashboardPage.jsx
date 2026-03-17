import { useEffect, useState, useCallback, useRef } from "react";
import {
  RefreshCw,
  BookOpen,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { formatDate } from "@/utils/formatDate";
import teacherActionService from "@/services/teacherActionService";
import teacherService from "@/services/teacherService";
import driveService from "@/services/driveService";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

// ── Helpers ───────────────────────────────────────────────────
const formatCertId = (num) => {
  if (num == null) return "—";
  return `CERT-${String(num).padStart(6, "0")}`;
};

// ── Summary Card ─────────────────────────────────────────────
function SummaryCard({ title, value, icon: Icon, loading, sub, warning }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
              {title}
            </p>
            {loading ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{value ?? "—"}</p>
            )}
            {sub && !loading && (
              <p className="text-xs text-muted-foreground">{sub}</p>
            )}
            {warning && !loading && (
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {warning}
              </p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stock Card ───────────────────────────────────────────────
function StockCard({ stock, loading }) {
  const stocks = stock ? (Array.isArray(stock) ? stock : [stock]) : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Stock Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <LoadingSkeleton rows={2} />
        ) : stocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stock data</p>
        ) : (
          stocks.map((s) => {
            const hasBatch = s.cert_range_start != null;
            const certAvailable = s.cert_quantity ?? 0;

            return (
              <div key={s.center_id} className="space-y-2">
                {stocks.length > 1 && (
                  <p className="text-xs font-medium text-muted-foreground">
                    {s.center_name}
                  </p>
                )}

                {/* Certificate Stock */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Certificate</span>
                    <span
                      className={`font-semibold tabular-nums ${s.cert_low_stock ? "text-amber-500" : ""}`}
                    >
                      {certAvailable}
                      {s.cert_low_stock && (
                        <AlertTriangle className="inline w-3 h-3 ml-1" />
                      )}
                    </span>
                  </div>

                  {hasBatch ? (
                    <div className="rounded-md bg-muted/30 px-2.5 py-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Range</span>
                        <span className="font-mono text-foreground">
                          {formatCertId(s.cert_range_start)} —{" "}
                          {formatCertId(s.cert_range_end)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Next assign
                        </span>
                        <span className="font-mono font-medium text-primary">
                          {formatCertId(s.cert_current_position)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500">
                      Belum ada batch. Hubungi admin.
                    </p>
                  )}
                </div>

                {/* Medal Stock */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Medal</span>
                  <span
                    className={`font-semibold tabular-nums ${s.medal_low_stock ? "text-amber-500" : ""}`}
                  >
                    {s.medal_quantity}
                    {s.medal_low_stock && (
                      <AlertTriangle className="inline w-3 h-3 ml-1" />
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ── Chart ────────────────────────────────────────────────────
function ActivityChart({ data, loading }) {
  if (loading)
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  if (!data?.length)
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        No activity data yet
      </div>
    );

  const chartData = [...data]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map((d) => ({
      month: format(parseISO(d.month + "-01"), "MMM yy"),
      "Cert Printed": d.cert_printed,
      "Scan Uploaded": d.cert_scan_uploaded,
      "Medal Issued": d.medal_printed,
    }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gCert" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gMedal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="Cert Printed"
          stroke="#6366f1"
          fill="url(#gCert)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Scan Uploaded"
          stroke="#22c55e"
          fill="url(#gScan)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Medal Issued"
          stroke="#f59e0b"
          fill="url(#gMedal)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Recent Certificates ──────────────────────────────────────
function RecentCertificates({ certificates, loading }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Recent Certificates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No certificates printed yet
          </p>
        ) : (
          [...certificates]
            .sort((a, b) => (a.scan_file_id ? 1 : 0) - (b.scan_file_id ? 1 : 0))
            .slice(0, 5)
            .map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {c.student_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.module_name}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {c.cert_unique_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(c.printed_at)}
                  </p>
                </div>
                <div className="shrink-0 mt-0.5">
                  {c.scan_file_id ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Scanned
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function TeacherDashboardPage() {
  const [certificates, setCertificates] = useState([]);
  const [activity, setActivity] = useState([]);
  const [stock, setStock] = useState(null);
  const [total, setTotal] = useState({ enrollments: 0, certs: 0, reports: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetched = useRef(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        enrollRes,
        certsRes,
        reportsRes,
        activityRes,
        stockRes,
        recentCertsRes,
      ] = await Promise.allSettled([
        teacherActionService.getEnrollments({ page: 1, limit: 1 }),
        teacherActionService.getCertificates({ page: 1, limit: 1 }),
        teacherActionService.getReports({ page: 1, limit: 1 }),
        teacherService.getActivity(),
        driveService.getTeacherStock(),
        teacherActionService.getCertificates({
          page: 1,
          limit: 20,
          is_reprint: "false",
        }),
      ]);

      if (enrollRes.status === "fulfilled")
        setTotal((t) => ({
          ...t,
          enrollments: enrollRes.value.pagination?.total ?? 0,
        }));
      if (certsRes.status === "fulfilled")
        setTotal((t) => ({
          ...t,
          certs: certsRes.value.pagination?.total ?? 0,
        }));
      if (reportsRes.status === "fulfilled")
        setTotal((t) => ({
          ...t,
          reports: reportsRes.value.pagination?.total ?? 0,
        }));
      if (activityRes.status === "fulfilled")
        setActivity(activityRes.value.data ?? []);
      if (stockRes.status === "fulfilled") setStock(stockRes.value.data);
      if (recentCertsRes.status === "fulfilled")
        setCertificates(recentCertsRes.value.data ?? []);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your teaching activity overview
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Enrollments"
          value={total.enrollments}
          icon={BookOpen}
          loading={loading}
        />
        <SummaryCard
          title="Certificates Printed"
          value={total.certs}
          icon={Award}
          loading={loading}
        />
        <SummaryCard
          title="Reports Created"
          value={total.reports}
          icon={FileText}
          loading={loading}
        />
        <StockCard stock={stock} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Monthly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={activity} loading={loading} />
          </CardContent>
        </Card>
        <RecentCertificates certificates={certificates} loading={loading} />
      </div>
    </div>
  );
}
