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
import moduleService from "@/services/moduleService";
import { formatDate } from "@/utils/formatDate";
import { formatActiveStatus } from "@/utils/formatStatus";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";

// ── Form Dialog ─────────────────────────────────────────────
function ModuleFormDialog({ open, onOpenChange, module, onSuccess }) {
  const isEdit = !!module;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(module?.name ?? "");
      setDescription(module?.description ?? "");
    }
  }, [open, module]);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Name is required");

    setLoading(true);
    try {
      if (isEdit) {
        await moduleService.update(module.id, {
          name: name.trim().toUpperCase(),
          description: description.trim() || null,
        });
        onOpenChange(false);
        toast.success("Module updated");
      } else {
        await moduleService.create({
          name: name.trim().toUpperCase(),
          description: description.trim() || undefined,
        });
        onOpenChange(false);
        toast.success("Module created");
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
          <DialogTitle>{isEdit ? "Edit Module" : "Add Module"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description ?? "—"}
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

      <ModuleFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditTarget(null);
        }}
        module={editTarget}
        onSuccess={fetchModules}
      />

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
