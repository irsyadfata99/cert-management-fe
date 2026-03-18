import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  PenLine,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import teacherActionService from "@/services/teacherActionService";
import driveService from "@/services/driveService";
import { toast } from "sonner";
import usePagination from "@/hooks/usePagination";
import { useNavigate } from "react-router-dom";

// ── Helpers ─────────────────────────────────────────────────

const TYPE_LABELS = {
  enrollment: { label: "Enrollment", color: "hsl(280,79%,66%)" },
  certificate: { label: "Certificate", color: "hsl(219,79%,66%)" },
  reprint: { label: "Reprint", color: "hsl(219,60%,50%)" },
  medal: { label: "Medal", color: "hsl(38,92%,60%)" },
  report: { label: "Report", color: "hsl(144,79%,50%)" },
};

const STATUS_MAP = {
  pending: { label: "Pending", variant: "outline" },
  cert_printed: { label: "Cert Printed", variant: "secondary" },
  scan_uploaded: { label: "Scan Uploaded", variant: "info" },
  report_uploaded: { label: "Report Uploaded", variant: "info" },
  complete: { label: "Complete", variant: "success" },
  scanned: { label: "Scanned", variant: "success" },
  not_scanned: { label: "Not Scanned", variant: "outline" },
  uploaded: { label: "Uploaded", variant: "success" },
  draft: { label: "Draft", variant: "warning" },
  issued: { label: "Issued", variant: "secondary" },
};

const formatDate = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const FETCH_LIMIT = 100;
const PAGE_SIZE = 15;

// ── Download report handler ──────────────────────────────────
function DownloadReportButton({ row }) {
  const [downloading, setDownloading] = useState(false);
  const reportId = row._raw?.id;
  const hasFile = !!row._raw?.drive_file_id;

  if (row.type !== "report") return null;

  const handleDownload = async () => {
    if (!reportId || !hasFile) return;
    setDownloading(true);
    try {
      const blob = await driveService.downloadReport(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!hasFile || downloading}
      title={
        !hasFile ? "Report not yet uploaded to Drive" : "Download PDF to print"
      }
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor: hasFile ? "hsl(144,79%,50%)" : "hsl(var(--border))",
        color: hasFile ? "hsl(144,79%,50%)" : "hsl(var(--muted-foreground))",
        background: "transparent",
      }}
    >
      <Download className="w-3 h-3" />
      {downloading ? "Opening..." : "Print PDF"}
    </button>
  );
}

// ── Continue Draft Button (FIXED) ────────────────────────────
function ContinueDraftButton({ row, allEnrollments }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (row.type !== "report" || row.status !== "draft") return null;

  const handleContinue = async () => {
    setLoading(true);
    try {
      const moduleName = row.module_name;

      const sameModuleEnrollments = allEnrollments.filter(
        (e) =>
          e.module_name === moduleName &&
          (e.enrollment_status === "scan_uploaded" ||
            e.enrollment_status === "report_drafted" ||
            e.enrollment_status === "cert_printed"),
      );

      const enrollmentItems = sameModuleEnrollments.map((e) => ({
        enrollment_id: e.enrollment_id,
        student_name: e.student_name,
        module_name: e.module_name,
        center_name: e.center_name ?? "",
      }));

      if (enrollmentItems.length === 0) {
        navigate("/teacher/final-report", {
          state: {
            enrollment: {
              enrollment_id: row._raw?.enrollment_id,
              student_name: row.student_name,
              module_name: row.module_name,
              center_name: row._raw?.center_name ?? "",
            },
          },
        });
        return;
      }

      if (enrollmentItems.length === 1) {
        navigate("/teacher/final-report", {
          state: { enrollment: enrollmentItems[0] },
        });
      } else {
        navigate("/teacher/final-report", {
          state: { enrollments: enrollmentItems },
        });
      }
    } catch (err) {
      toast.error("Gagal memuat data enrollment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleContinue}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors disabled:opacity-60"
      style={{
        borderColor: "hsl(219,79%,66%)",
        color: "hsl(219,79%,66%)",
        background: "transparent",
      }}
      title="Lanjutkan mengisi draft laporan"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <PenLine className="w-3 h-3" />
      )}
      {loading ? "Memuat..." : "Continue Draft"}
    </button>
  );
}

// ── Actions cell ─────────────────────────────────────────────
function makeColumns(allEnrollments) {
  return [
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }) => {
        const t = TYPE_LABELS[row.original.type] ?? {
          label: row.original.type,
          color: "hsl(var(--muted-foreground))",
        };
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: t.color + "20", color: t.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: t.color }}
            />
            {t.label}
          </span>
        );
      },
    },
    {
      header: "Student",
      accessorKey: "student_name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">
          {row.original.student_name ?? "—"}
        </span>
      ),
    },
    {
      header: "Module",
      accessorKey: "module_name",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.module_name ?? "—"}
        </span>
      ),
    },
    {
      header: "Detail",
      accessorKey: "detail",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.detail ?? "—"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const s = STATUS_MAP[row.original.status] ?? {
          label: row.original.status ?? "—",
          variant: "outline",
        };
        return <StatusBadge label={s.label} variant={s.variant} dot />;
      },
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(row.original.date)}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ContinueDraftButton
            row={row.original}
            allEnrollments={allEnrollments}
          />
          <DownloadReportButton row={row.original} />
        </div>
      ),
    },
  ];
}

// ── Normalize ────────────────────────────────────────────────
const normalizeEnrollments = (data) =>
  data.map((e) => ({
    id: `enrollment-${e.enrollment_id}`,
    type: "enrollment",
    student_name: e.student_name,
    module_name: e.module_name,
    detail: e.center_name,
    status: e.enrollment_status ?? "pending",
    date: e.enrolled_at,
    _raw: e,
  }));

const normalizeCertificates = (data) =>
  data.map((c) => ({
    id: `cert-${c.id}`,
    type: c.is_reprint ? "reprint" : "certificate",
    student_name: c.student_name,
    module_name: c.module_name,
    detail: c.cert_unique_id,
    status: c.scan_file_id ? "scanned" : "not_scanned",
    date: c.printed_at,
    _raw: c,
  }));

const normalizeMedals = (data) =>
  data.map((m) => ({
    id: `medal-${m.id}`,
    type: "medal",
    student_name: m.student_name,
    module_name: m.module_name,
    detail: m.medal_unique_id,
    status: "issued",
    date: m.printed_at,
    _raw: m,
  }));

const normalizeReports = (data) =>
  data.map((r) => ({
    id: `report-${r.id}`,
    type: "report",
    student_name: r.student_name,
    module_name: r.module_name,
    detail: r.academic_year
      ? `${r.academic_year} · ${r.period ?? ""}`.trim()
      : (r.period ?? "—"),
    status: r.is_draft ? "draft" : "uploaded",
    date: r.created_at,
    _raw: r,
  }));

// ── Filter options ───────────────────────────────────────────
const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "enrollment", label: "Enrollment" },
  { value: "certificate", label: "Certificate" },
  { value: "reprint", label: "Reprint" },
  { value: "medal", label: "Medal" },
  { value: "report", label: "Report" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "cert_printed", label: "Cert Printed" },
  { value: "scan_uploaded", label: "Scan Uploaded" },
  { value: "report_uploaded", label: "Report Uploaded" },
  { value: "complete", label: "Complete" },
  { value: "scanned", label: "Scanned" },
  { value: "not_scanned", label: "Not Scanned" },
  { value: "uploaded", label: "Uploaded" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
];

// ── Main Page ────────────────────────────────────────────────
export default function HistoryPage() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [truncationInfo, setTruncationInfo] = useState(null);

  const [rawEnrollments, setRawEnrollments] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { page, goToPage, reset } = usePagination(PAGE_SIZE);

  useEffect(() => {
    reset();
  }, [search, selectedType, selectedStatus, dateFrom, dateTo, reset]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [enrollRes, certRes, reportRes, medalRes] = await Promise.all([
        teacherActionService.getEnrollments({
          limit: FETCH_LIMIT,
          include_inactive: "true",
        }),
        teacherActionService.getCertificates({ limit: FETCH_LIMIT }),
        teacherActionService.getReports({ limit: FETCH_LIMIT }),
        teacherActionService.getMedals({ limit: FETCH_LIMIT }),
      ]);

      const enrollData = enrollRes.data ?? [];
      const certData = certRes.data ?? [];
      const reportData = reportRes.data ?? [];
      const medalData = medalRes.data ?? [];

      setRawEnrollments(enrollData);

      const enrollTotal = enrollRes.pagination?.total ?? 0;
      const certTotal = certRes.pagination?.total ?? 0;
      const reportTotal = reportRes.pagination?.total ?? 0;
      const medalTotal = medalRes.pagination?.total ?? 0;

      const truncated = [];
      if (enrollTotal > FETCH_LIMIT)
        truncated.push(
          `Enrollments (showing ${FETCH_LIMIT} of ${enrollTotal})`,
        );
      if (certTotal > FETCH_LIMIT)
        truncated.push(`Certificates (showing ${FETCH_LIMIT} of ${certTotal})`);
      if (reportTotal > FETCH_LIMIT)
        truncated.push(`Reports (showing ${FETCH_LIMIT} of ${reportTotal})`);
      if (medalTotal > FETCH_LIMIT)
        truncated.push(`Medals (showing ${FETCH_LIMIT} of ${medalTotal})`);

      setTruncationInfo(truncated.length > 0 ? truncated : null);

      const rows = [
        ...normalizeEnrollments(enrollData),
        ...normalizeCertificates(certData),
        ...normalizeMedals(medalData),
        ...normalizeReports(reportData),
      ];

      rows.sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0));

      setAllRows(rows);
      if (isRefresh) toast.success("History refreshed");
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (selectedType !== "all" && row.type !== selectedType) return false;
      if (selectedStatus !== "all" && row.status !== selectedStatus)
        return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !row.student_name?.toLowerCase().includes(q) &&
          !row.module_name?.toLowerCase().includes(q)
        )
          return false;
      }
      if (dateFrom && row.date && new Date(row.date) < new Date(dateFrom))
        return false;
      if (
        dateTo &&
        row.date &&
        new Date(row.date) > new Date(`${dateTo}T23:59:59`)
      )
        return false;
      return true;
    });
  }, [allRows, search, selectedType, selectedStatus, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pagedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const draftCount = useMemo(
    () =>
      allRows.filter((r) => r.type === "report" && r.status === "draft").length,
    [allRows],
  );

  const summary = useMemo(() => {
    const counts = {
      enrollment: 0,
      certificate: 0,
      reprint: 0,
      medal: 0,
      report: 0,
    };
    for (const r of allRows) {
      if (counts[r.type] !== undefined) counts[r.type]++;
    }
    return counts;
  }, [allRows]);

  const columns = useMemo(() => makeColumns(rawEnrollments), [rawEnrollments]);

  const handleExport = () => {
    if (filteredRows.length === 0) return;
    const headers = ["Type", "Student", "Module", "Detail", "Status", "Date"];
    const rows = filteredRows.map((r) => [
      r.type,
      r.student_name ?? "",
      r.module_name ?? "",
      r.detail ?? "",
      r.status ?? "",
      r.date ? new Date(r.date).toISOString().split("T")[0] : "",
    ]);
    const escape = (v) => {
      const s = String(v);
      return s.includes(",") || s.includes('"')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const csv = [headers, ...rows]
      .map((r) => r.map(escape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `history_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="All your enrollments, certificates, medals, and reports."
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

      {/* Draft reports banner */}
      {!loading && draftCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-600 dark:text-blue-400">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 shrink-0" />
            <span>
              You have <span className="font-semibold">{draftCount}</span>{" "}
              unfinished draft report{draftCount !== 1 ? "s" : ""}.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 shrink-0"
            onClick={() => setSelectedStatus("draft")}
          >
            View Drafts
          </Button>
        </div>
      )}

      {/* Truncation warning */}
      {truncationInfo && !loading && (
        <div className="flex flex-col gap-1 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              Some older records are not shown (limit: {FETCH_LIMIT} per
              category):
            </span>
          </div>
          <ul className="ml-6 list-disc text-xs space-y-0.5">
            {truncationInfo.map((info) => (
              <li key={info}>{info}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Chips */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).map(([type, count]) => {
            const t = TYPE_LABELS[type];
            return (
              <button
                key={type}
                onClick={() =>
                  setSelectedType(selectedType === type ? "all" : type)
                }
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  background:
                    selectedType === type ? t.color + "20" : "transparent",
                  borderColor:
                    selectedType === type ? t.color : "hsl(var(--border))",
                  color:
                    selectedType === type
                      ? t.color
                      : "hsl(var(--muted-foreground))",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: t.color }}
                />
                {t.label}
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
          <span className="inline-flex items-center text-xs text-muted-foreground px-2">
            Total: {allRows.length}
          </span>
        </div>
      )}

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search student or module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent position="popper">
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent position="popper">
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 h-9 text-sm"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 h-9 text-sm"
            />

            {(search ||
              selectedType !== "all" ||
              selectedStatus !== "all" ||
              dateFrom ||
              dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground"
                onClick={() => {
                  setSearch("");
                  setSelectedType("all");
                  setSelectedStatus("all");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {filteredRows.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {filteredRows.length} record
                  {filteredRows.length !== 1 ? "s" : ""}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={filteredRows.length === 0}
                onClick={handleExport}
                className="h-9"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
          <CardDescription className="text-xs">
            All records sorted by date, newest first
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={pagedRows}
            loading={loading}
            emptyTitle="No records found"
            emptyDescription="Try adjusting the filters or date range."
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
    </div>
  );
}
