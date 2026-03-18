import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Power,
  FileSearch,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
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
import SearchInput from "@/components/common/SearchInput";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import enrollmentService from "@/services/enrollmentService";
import studentService from "@/services/studentService";
import teacherService from "@/services/teacherService";
import moduleService from "@/services/moduleService";
import { formatDate } from "@/utils/formatDate";
import { formatEnrollmentStatus } from "@/utils/formatStatus";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";
import { cn } from "@/lib/utils";

// ── Dropdown Search Component ────────────────────────────────
function SearchableDropdown({
  label,
  placeholder,
  value,
  onSelect,
  fetchFn,
  displayKey = "name",
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState(null);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const loadOptions = async () => {
      setOptions(null);
      try {
        const res = await fetchFn({
          search: debouncedQuery || undefined,
          limit: 20,
          is_active: "true",
        });
        if (!cancelled) setOptions(res.data ?? []);
      } catch {
        if (!cancelled) setOptions([]);
      }
    };

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, fetchFn]);

  const selected = value;
  const isLoading = options === null;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <Label>
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <div
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center justify-between w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm cursor-pointer",
            "transition-[color,box-shadow] outline-none dark:bg-input/30",
            open && "border-ring ring-[3px] ring-ring/50",
          )}
        >
          <span
            className={cn(
              !selected ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {selected ? selected[displayKey] : placeholder}
          </span>
          <svg
            className="w-4 h-4 text-muted-foreground opacity-50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {open && (
          <div
            className="absolute z-100 mt-1 w-full rounded-md border border-border shadow-md"
            style={{
              background: "hsl(var(--popover))",
              backdropFilter: "none",
            }}
          >
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto p-1">
              {isLoading ? (
                <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                  Loading...
                </li>
              ) : options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                  No results found
                </li>
              ) : (
                options.map((opt) => (
                  <li
                    key={opt.id}
                    onClick={() => {
                      onSelect(opt);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex flex-col px-3 py-2 rounded-sm text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <span className="font-medium">{opt[displayKey]}</span>
                    {opt.email && (
                      <span className="text-xs text-muted-foreground">
                        {opt.email}
                      </span>
                    )}
                    {opt.center_name && (
                      <span className="text-xs text-muted-foreground">
                        {opt.center_name}
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Enrollment Dialog ─────────────────────────────────
function EnrollmentFormDialog({ open, onOpenChange, modules, onSuccess }) {
  const [student, setStudent] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [moduleId, setModuleId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStudent(null);
      setTeacher(null);
      setModuleId("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!student) return toast.error("Student is required");
    if (!teacher) return toast.error("Teacher is required");
    if (!moduleId) return toast.error("Module is required");

    setLoading(true);
    try {
      await enrollmentService.create({
        student_id: student.id,
        teacher_id: teacher.id,
        module_id: Number(moduleId),
      });
      onOpenChange(false);
      toast.success("Enrollment created");
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Enrollment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <SearchableDropdown
            label="Student"
            placeholder="Search student..."
            value={student}
            onSelect={setStudent}
            fetchFn={studentService.getAll}
          />
          <SearchableDropdown
            label="Teacher"
            placeholder="Search teacher..."
            value={teacher}
            onSelect={setTeacher}
            fetchFn={teacherService.getAll}
          />
          <div className="space-y-1.5">
            <Label htmlFor="enrollment-module">
              Module <span className="text-destructive">*</span>
            </Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger id="enrollment-module" className="w-full">
                <SelectValue placeholder="Select a module..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {modules.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Status Row ───────────────────────────────────────────────
function StatusRow({ label, complete, date }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5">
        {complete ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {date ? formatDate(date) : "—"}
      </span>
    </div>
  );
}

// ── Pair Status Dialog ───────────────────────────────────────
function PairStatusDialog({ open, onOpenChange, enrollmentId }) {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (!open || !enrollmentId) return;
    let cancelled = false;
    const loadData = async () => {
      setData(undefined);
      try {
        const res = await enrollmentService.getPairStatus(enrollmentId);
        if (!cancelled) setData(res.data ?? null);
      } catch {
        if (!cancelled) {
          toast.error("Failed to load pair status");
          setData(null);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [open, enrollmentId]);

  const isLoading = data === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pair Status</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : data ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-1">
              <p className="text-sm font-medium">{data.student_name}</p>
              <p className="text-xs text-muted-foreground">
                {data.module_name}
              </p>
            </div>

            <div className="rounded-lg border border-border px-4">
              <StatusRow
                label="Certificate Scan"
                complete={data.scan_complete}
                date={data.scan_uploaded_at}
              />
              <StatusRow
                label="Final Report (Drive)"
                complete={data.report_complete}
                date={data.report_uploaded_at}
              />
            </div>

            <div
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-4 py-3 border",
                data.pair_complete
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
              )}
            >
              {data.pair_complete ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 shrink-0" />
              )}
              <span className="text-sm font-medium">
                {data.pair_complete
                  ? "All documents complete"
                  : `Missing: ${data.missing_items?.join(", ")}`}
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { page, limit, goToPage, reset } = usePagination(10);
  const [sorting, setSorting] = useState({ key: "enrolled_at", order: "desc" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [pairStatusTarget, setPairStatusTarget] = useState(null);

  useEffect(() => {
    moduleService
      .getAll({ limit: 100, is_active: "true" })
      .then((res) => setModules(res.data ?? []))
      .catch(() => toast.error("Failed to load modules"));
  }, []);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enrollmentService.getAll({
        page,
        limit,
        sort_by: sorting.key,
        sort_order: sorting.order,
        enrollment_status: statusFilter !== "all" ? statusFilter : undefined,
        module_id: moduleFilter !== "all" ? moduleFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setEnrollments(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sorting, statusFilter, moduleFilter, debouncedSearch]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    reset();
  }, [statusFilter, moduleFilter, debouncedSearch, reset]);

  const handleSortChange = useCallback((key) => {
    setSorting((prev) =>
      prev.key === key
        ? { key, order: prev.order === "asc" ? "desc" : "asc" }
        : { key, order: "asc" },
    );
  }, []);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await enrollmentService.deactivate(deactivateTarget.id);
      toast.success("Enrollment deactivated");
      setDeactivateTarget(null);
      fetchEnrollments();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const columns = [
    {
      header: "Student",
      accessorKey: "student_name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
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
      header: "Teacher",
      accessorKey: "teacher_name",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.teacher_name}
        </span>
      ),
    },
    {
      header: "Center",
      accessorKey: "center_name",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.center_name ?? "—"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "enrollment_status",
      cell: ({ row }) => {
        const { label, variant } = formatEnrollmentStatus(
          row.original.enrollment_status,
        );
        return <StatusBadge label={label} variant={variant} dot />;
      },
    },
    {
      header: "Enrolled",
      accessorKey: "enrolled_at",
      sortKey: "enrolled_at",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatDate(row.original.enrolled_at)}
        </span>
      ),
    },
    {
      header: "",
      accessorKey: "actions",
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              title="Pair Status"
              onClick={() => setPairStatusTarget(e)}
            >
              <FileSearch className="w-3.5 h-3.5" />
            </Button>
            {e.is_active && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Deactivate"
                onClick={() => setDeactivateTarget(e)}
              >
                <Power className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Enrollments"
        description="Manage student enrollments across modules and teachers."
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Enrollment
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by student name..."
          className="max-w-xs"
        />
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cert_printed">Cert Printed</SelectItem>
            <SelectItem value="scan_uploaded">Scan Uploaded</SelectItem>
            <SelectItem value="report_drafted">Report Drafted</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total} enrollment{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={enrollments}
        loading={loading}
        sorting={sorting}
        onSortChange={handleSortChange}
        emptyTitle="No enrollments found"
        emptyDescription="Start by creating a new enrollment."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      <EnrollmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        modules={modules}
        onSuccess={fetchEnrollments}
      />

      <PairStatusDialog
        open={!!pairStatusTarget}
        onOpenChange={(v) => {
          if (!v) setPairStatusTarget(null);
        }}
        enrollmentId={pairStatusTarget?.id}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => {
          if (!v) setDeactivateTarget(null);
        }}
        title="Deactivate Enrollment"
        description={`Are you sure you want to deactivate the enrollment for "${deactivateTarget?.student_name}"? This cannot be undone easily.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
