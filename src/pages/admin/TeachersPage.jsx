import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Pencil,
  Power,
  Building2,
  Trash2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
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
import teacherService from "@/services/teacherService";
import centerService from "@/services/centerService";
import { formatDate } from "@/utils/formatDate";
import { formatActiveStatus } from "@/utils/formatStatus";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";

// ── Add / Edit Teacher Dialog ────────────────────────────────
function TeacherFormDialog({
  open,
  onOpenChange,
  teacher,
  centers,
  onSuccess,
}) {
  const isEdit = !!teacher;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [centerId, setCenterId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(teacher?.name ?? "");
      setEmail(teacher?.email ?? "");
      setCenterId(teacher?.center_id ? String(teacher.center_id) : "");
    }
  }, [open, teacher]);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Name is required");
    if (!isEdit && !email.trim()) return toast.error("Email is required");
    if (!isEdit && !centerId) return toast.error("Center is required");

    setLoading(true);
    try {
      if (isEdit) {
        await teacherService.update(teacher.id, {
          name: name.trim(),
          email: email.trim() || undefined,
        });
        onOpenChange(false);
        toast.success("Teacher updated");
      } else {
        await teacherService.create({
          name: name.trim(),
          email: email.trim(),
          center_id: Number(centerId),
        });
        onOpenChange(false);
        toast.success("Teacher pre-registered");
      }
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
          <DialogTitle>{isEdit ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="teacher-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="teacher-name"
              placeholder="e.g. Budi Santoso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teacher-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="teacher-email"
              type="email"
              placeholder="e.g. budi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Email can be changed but will deactivate the account.
              </p>
            )}
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="teacher-center">
                Primary Center <span className="text-destructive">*</span>
              </Label>
              <Select value={centerId} onValueChange={setCenterId}>
                <SelectTrigger id="teacher-center" className="w-full">
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
            </div>
          )}
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

// ── Import Result Dialog ─────────────────────────────────────
function ImportResultDialog({ open, onOpenChange, result }) {
  if (!result) return null;
  const { imported, skipped, summary } = result;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Result</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Total",
                value: summary.total,
                color: "text-foreground",
              },
              {
                label: "Imported",
                value: summary.imported,
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Skipped",
                value: summary.skipped,
                color: "text-amber-600 dark:text-amber-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center"
              >
                <p className={`text-xl font-bold ${item.color}`}>
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Skipped list */}
          {skipped.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Skipped ({skipped.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {skipped.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 px-3 py-2 rounded-md border border-border bg-amber-500/5 text-xs"
                  >
                    <span className="text-muted-foreground truncate">
                      {s.email}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 shrink-0">
                      {s.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imported list */}
          {imported.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Imported ({imported.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {imported.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-emerald-500/5 text-xs"
                  >
                    <span className="text-muted-foreground truncate">
                      {t.email}
                    </span>
                    {t.center_name && (
                      <span className="font-medium text-foreground shrink-0">
                        {t.center_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button size="sm">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Manage Centers Dialog ────────────────────────────────────
function ManageCentersDialog({
  open,
  onOpenChange,
  teacher,
  centers,
  onSuccess,
}) {
  const [assignedCenters, setAssignedCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [assignCenterId, setAssignCenterId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchCenters = useCallback(async () => {
    if (!teacher) return;
    setLoadingCenters(true);
    try {
      const res = await teacherService.getCenters(teacher.id);
      setAssignedCenters(res.data ?? []);
    } catch {
      toast.error("Failed to load teacher centers");
    } finally {
      setLoadingCenters(false);
    }
  }, [teacher]);

  useEffect(() => {
    if (open) {
      fetchCenters();
      setAssignCenterId("");
      setIsPrimary(false);
    }
  }, [open, fetchCenters]);

  const availableCenters = centers.filter(
    (c) => !assignedCenters.some((ac) => ac.center_id === c.id),
  );

  const handleAssign = async () => {
    if (!assignCenterId) return toast.error("Please select a center");
    setAssigning(true);
    try {
      await teacherService.assignCenter(teacher.id, {
        center_id: Number(assignCenterId),
        is_primary: isPrimary,
      });
      toast.success("Center assigned");
      setAssignCenterId("");
      setIsPrimary(false);
      fetchCenters();
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to assign center");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (centerId) => {
    setRemovingId(centerId);
    try {
      await teacherService.removeCenter(teacher.id, centerId);
      toast.success("Center removed");
      fetchCenters();
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to remove center");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Manage Centers
            {teacher && (
              <span className="block text-sm font-normal text-muted-foreground mt-0.5">
                {teacher.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Assigned Centers List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Assigned Centers
          </p>
          {loadingCenters ? (
            <p className="text-sm text-muted-foreground py-2">Loading...</p>
          ) : assignedCenters.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No centers assigned.
            </p>
          ) : (
            <div className="space-y-1.5">
              {assignedCenters.map((ac) => (
                <div
                  key={ac.center_id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {ac.center_name}
                    </span>
                    {ac.is_primary && (
                      <StatusBadge label="Primary" variant="info" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    disabled={removingId === ac.center_id}
                    onClick={() => handleRemove(ac.center_id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign New Center */}
        {availableCenters.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Assign New Center
            </p>
            <div className="space-y-1.5">
              <Select value={assignCenterId} onValueChange={setAssignCenterId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a center..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  {availableCenters.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-primary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-input"
              />
              <Label
                htmlFor="is-primary"
                className="text-sm font-normal cursor-pointer"
              >
                Set as primary center
              </Label>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleAssign}
              disabled={assigning || !assignCenterId}
            >
              {assigning ? "Assigning..." : "Assign Center"}
            </Button>
          </div>
        )}

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
export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
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
  const [manageCentersTarget, setManageCentersTarget] = useState(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importResultOpen, setImportResultOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    centerService
      .getAllAdmin({ limit: 100 })
      .then((res) => setCenters(res.data ?? []))
      .catch(() => toast.error("Failed to load centers"));
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort_by: sorting.key,
        sort_order: sorting.order,
        is_active: statusFilter !== "all" ? statusFilter : undefined,
        center_id: centerFilter !== "all" ? centerFilter : undefined,
      });
      setTeachers(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sorting, statusFilter, centerFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    reset();
  }, [debouncedSearch, statusFilter, centerFilter, reset]);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await teacherService.deactivate(deactivateTarget.id);
      toast.success(`Teacher "${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await teacherService.downloadTemplate();
      toast.success("Template downloaded");
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await teacherService.importExcel(file);
      setImportResult(res.data);
      setImportResultOpen(true);
      if (res.data.summary.imported > 0) fetchTeachers();
      toast.success(
        `Imported ${res.data.summary.imported} teacher${res.data.summary.imported !== 1 ? "s" : ""}`,
      );
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      sortKey: "name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      header: "Centers",
      accessorKey: "centers",
      cell: ({ row }) => {
        const teacherCenters = row.original.centers ?? [];
        if (teacherCenters.length === 0) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {teacherCenters.map((c) => (
              <StatusBadge
                key={c.center_id}
                label={c.center_name}
                variant={c.is_primary ? "info" : "outline"}
              />
            ))}
          </div>
        );
      },
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
        const t = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              title="Manage Centers"
              onClick={() => setManageCentersTarget(t)}
            >
              <Building2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              title="Edit Teacher"
              onClick={() => {
                setEditTarget(t);
                setFormOpen(true);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {t.is_active && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Deactivate Teacher"
                onClick={() => setDeactivateTarget(t)}
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
        title="Teachers"
        description="Manage teachers and their center assignments."
        actions={
          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {importing ? "Importing..." : "Import Excel"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search teachers..."
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
            {total} teacher{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        loading={loading}
        sorting={sorting}
        onSortChange={setSorting}
        emptyTitle="No teachers found"
        emptyDescription={
          debouncedSearch
            ? `No teachers match "${debouncedSearch}"`
            : "Start by adding a new teacher."
        }
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      {/* Add / Edit Dialog */}
      <TeacherFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditTarget(null);
        }}
        teacher={editTarget}
        centers={centers}
        onSuccess={fetchTeachers}
      />

      {/* Manage Centers Dialog */}
      <ManageCentersDialog
        open={!!manageCentersTarget}
        onOpenChange={(v) => {
          if (!v) setManageCentersTarget(null);
        }}
        teacher={manageCentersTarget}
        centers={centers}
        onSuccess={fetchTeachers}
      />

      {/* Import Result Dialog */}
      <ImportResultDialog
        open={importResultOpen}
        onOpenChange={setImportResultOpen}
        result={importResult}
      />

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => {
          if (!v) setDeactivateTarget(null);
        }}
        title="Deactivate Teacher"
        description={`Are you sure you want to deactivate "${deactivateTarget?.name}"? They will lose access to the system.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
