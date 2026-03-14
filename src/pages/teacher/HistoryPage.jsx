import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, RefreshCw, Download, Filter } from "lucide-react";
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
  draft: { label: "Draft", variant: "secondary" },
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

// ── Columns ──────────────────────────────────────────────────

const columns = [
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
    cell: ({ row }) => <DownloadReportButton row={row.original} />,
  },
];

// ── Normalize raw API data into unified rows ─────────────────

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
  data
    .filter((c) => !c.is_reprint)
    .map((c) => ({
      id: `medal-${c.id}`,
      type: "medal",
      student_name: c.student_name,
      module_name: c.module_name,
      detail: `Bundled with cert ${c.cert_unique_id}`,
      status: "issued",
      date: c.printed_at,
      _raw: c,
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
    status: r.drive_file_id ? "uploaded" : "draft",
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

const PAGE_SIZE = 15;

// [FIX #13] Ganti limit: 500 dengan fetch bertahap menggunakan
// limit yang wajar (100) per tipe data
const FETCH_LIMIT = 100;

// ── Main Page ────────────────────────────────────────────────

export default function HistoryPage() {
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { page, goToPage, reset } = usePagination(PAGE_SIZE);

  useEffect(() => {
    reset();
  }, [search, selectedType, selectedStatus, dateFrom, dateTo, reset]);

  // [FIX #13] fetch dengan limit 100 per tipe, bukan 500
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [enrollRes, certRes, reportRes] = await Promise.all([
        teacherActionService.getEnrollments({ limit: FETCH_LIMIT }),
        teacherActionService.getCertificates({ limit: FETCH_LIMIT }),
        teacherActionService.getReports({ limit: FETCH_LIMIT }),
      ]);

      const certData = certRes.data ?? [];

      const rows = [
        ...normalizeEnrollments(enrollRes.data ?? []),
        ...normalizeCertificates(certData),
        ...normalizeMedals(certData),
        ...normalizeReports(reportRes.data ?? []),
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

  // ── Client-side filter ───────────────────────────────────
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

  // ── Pagination ───────────────────────────────────────────
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pagedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // ── Summary counts ───────────────────────────────────────
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

  // ── Export CSV ───────────────────────────────────────────
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

      {/* ── Summary Chips ── */}
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

      {/* ── Filters ── */}
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

      {/* ── Table ── */}
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
