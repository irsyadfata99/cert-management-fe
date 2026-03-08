import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import studentService from "@/services/studentService";
import centerService from "@/services/centerService";
import { formatDate } from "@/utils/formatDate";
import { formatActiveStatus } from "@/utils/formatStatus";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";

// ── Form Dialog ─────────────────────────────────────────────
function StudentFormDialog({
  open,
  onOpenChange,
  student,
  centers,
  onSuccess,
}) {
  const isEdit = !!student;
  const [name, setName] = useState("");
  const [centerId, setCenterId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(student?.name ?? "");
      setCenterId(student?.center_id ? String(student.center_id) : "");
    }
  }, [open, student]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!centerId) {
      toast.error("Center is required");
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await studentService.update(student.id, {
          name: name.trim(),
          center_id: Number(centerId),
        });
        toast.success("Student updated");
      } else {
        await studentService.create({
          name: name.trim(),
          center_id: Number(centerId),
        });
        toast.success("Student created");
      }
      onSuccess();
      onOpenChange(false);
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
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="student-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="student-name"
              placeholder="e.g. Andi Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="student-center">
              Center <span className="text-destructive">*</span>
            </Label>
            <Select value={centerId} onValueChange={setCenterId}>
              <SelectTrigger id="student-center" className="w-full">
                <SelectValue placeholder="Select a center..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {centers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && student?.center_name && (
              <p className="text-xs text-muted-foreground">
                Current center:{" "}
                <span className="font-medium">{student.center_name}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState([]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { page, limit, goToPage, reset } = usePagination(10);
  const [sorting, setSorting] = useState({ key: "name", order: "asc" });
  const [statusFilter, setStatusFilter] = useState("true");
  const [centerFilter, setCenterFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  // [CHANGED] Gunakan getAllForAdmin agar admin tidak kena 403
  useEffect(() => {
    centerService
      .getAllForAdmin({ limit: 100 })
      .then((res) => setCenters(res.data ?? []))
      .catch(() => toast.error("Failed to load centers"));
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort_by: sorting.key,
        sort_order: sorting.order,
        is_active: statusFilter !== "all" ? statusFilter : undefined,
        center_id: centerFilter !== "all" ? centerFilter : undefined,
      });
      setStudents(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sorting, statusFilter, centerFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    reset();
  }, [debouncedSearch, statusFilter, centerFilter, reset]);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await studentService.deactivate(deactivateTarget.id);
      toast.success(`Student "${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      sortKey: "name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
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
      accessorKey: "is_active",
      cell: ({ row }) => {
        const { label, variant } = formatActiveStatus(row.original.is_active);
        return <StatusBadge label={label} variant={variant} dot />;
      },
    },
    {
      header: "Created",
      accessorKey: "created_at",
      sortKey: "created_at",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      header: "",
      accessorKey: "actions",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditTarget(s);
                setFormOpen(true);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {s.is_active && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeactivateTarget(s)}
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
        title="Students"
        description="Manage students across all centers."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search students..."
          className="max-w-xs"
        />
        <Select value={centerFilter} onValueChange={setCenterFilter}>
          <SelectTrigger className="w-44">
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total} student{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={students}
        loading={loading}
        sorting={sorting}
        onSortChange={setSorting}
        emptyTitle="No students found"
        emptyDescription={
          debouncedSearch
            ? `No students match "${debouncedSearch}"`
            : "Start by adding a new student."
        }
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      <StudentFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditTarget(null);
        }}
        student={editTarget}
        centers={centers}
        onSuccess={fetchStudents}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => {
          if (!v) setDeactivateTarget(null);
        }}
        title="Deactivate Student"
        description={`Are you sure you want to deactivate "${deactivateTarget?.name}"? They will lose access to all activities.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
