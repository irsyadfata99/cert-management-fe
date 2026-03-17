import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Power, Download, FileSpreadsheet } from "lucide-react";
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
import moduleService from "@/services/moduleService";
import { formatDate } from "@/utils/formatDate";
import { formatActiveStatus } from "@/utils/formatStatus";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";

// ── Form Dialog ─────────────────────────────────────────────
function ModuleFormDialog({ open, onOpenChange, module, onSuccess }) {
  const isEdit = !!module;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCode(module?.code ?? "");
      setName(module?.name ?? "");
      setDescription(module?.description ?? "");
    }
  }, [open, module]);

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error("Module code is required");
    if (!name.trim()) return toast.error("Module name is required");

    setLoading(true);
    try {
      if (isEdit) {
        await moduleService.update(module.id, {
          code: code.trim().toUpperCase(),
          name: name.trim().toUpperCase(),
          description: description.trim() || null,
        });
        toast.success("Module updated");
      } else {
        await moduleService.create({
          code: code.trim().toUpperCase(),
          name: name.trim().toUpperCase(),
          description: description.trim() || undefined,
        });
        toast.success("Module created");
      }
      onOpenChange(false);
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
          <DialogTitle>{isEdit ? "Edit Module" : "Add Module"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="module-code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="module-code"
              placeholder="e.g. SCR-001"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ textTransform: "uppercase" }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="module-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="module-name"
              placeholder="e.g. SCRATCH BEGINNER"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ textTransform: "uppercase" }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="module-description">Description</Label>
            <textarea
              id="module-description"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none"
            />
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
                    <div>
                      <span className="font-mono font-medium">{s.code}</span>
                      <span className="text-muted-foreground ml-2">
                        {s.name}
                      </span>
                    </div>
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
                {imported.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-emerald-500/5 text-xs"
                  >
                    <span className="font-mono font-medium">{m.code}</span>
                    <span className="text-muted-foreground">{m.name}</span>
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

// ── Main Page ───────────────────────────────────────────────
export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { page, limit, goToPage, reset } = usePagination(10);
  const [sorting, setSorting] = useState({ key: "name", order: "asc" });
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importResultOpen, setImportResultOpen] = useState(false);
  const fileInputRef = useRef(null);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moduleService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort_by: sorting.key,
        sort_order: sorting.order,
        is_active: statusFilter !== "all" ? statusFilter : undefined,
      });
      setModules(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sorting, statusFilter]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    reset();
  }, [debouncedSearch, statusFilter, reset]);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await moduleService.deactivate(deactivateTarget.id);
      toast.success(`Module "${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
      fetchModules();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await moduleService.downloadTemplate();
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
      const res = await moduleService.importExcel(file);
      setImportResult(res.data);
      setImportResultOpen(true);
      if (res.data.summary.imported > 0) fetchModules();
      toast.success(
        `Imported ${res.data.summary.imported} module${res.data.summary.imported !== 1 ? "s" : ""}`,
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
      header: "Code",
      accessorKey: "code",
      sortKey: "code",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {row.original.code ?? "—"}
        </span>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      sortKey: "name",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
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
        const m = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              title="Edit Module"
              onClick={() => {
                setEditTarget(m);
                setFormOpen(true);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {m.is_active && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Deactivate Module"
                onClick={() => setDeactivateTarget(m)}
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
        title="Modules"
        description="Manage learning modules available across all centers."
        actions={
          <div className="flex items-center gap-2">
            {/* Hidden file input for Excel import */}
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
              Add Module
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search modules..."
          className="max-w-xs"
        />
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
            {total} module{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={modules}
        loading={loading}
        sorting={sorting}
        onSortChange={setSorting}
        emptyTitle="No modules found"
        emptyDescription={
          debouncedSearch
            ? `No modules match "${debouncedSearch}"`
            : "Start by adding a new module."
        }
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      {/* Add / Edit Dialog */}
      <ModuleFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditTarget(null);
        }}
        module={editTarget}
        onSuccess={fetchModules}
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
        title="Deactivate Module"
        description={`Are you sure you want to deactivate "${deactivateTarget?.name}"? It will no longer be available for new enrollments.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
