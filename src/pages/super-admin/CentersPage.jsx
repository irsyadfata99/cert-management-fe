import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import DataTable from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import centerService from "@/services/centerService";
import { formatDate } from "@/utils/formatDate";
import { formatActiveStatus } from "@/utils/formatStatus";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";

// ── Form Dialog (Create / Edit) ─────────────────────────────
function CenterFormDialog({ open, onOpenChange, center, onSuccess }) {
  const isEdit = !!center;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(center?.name ?? "");
      setAddress(center?.address ?? "");
    }
  }, [open, center]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Center name is required");
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await centerService.update(center.id, { name: name.trim(), address: address.trim() || null });
        toast.success("Center updated");
      } else {
        await centerService.create({ name: name.trim(), address: address.trim() || null });
        toast.success("Center created");
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
      <DialogContent className="sm:max-w-md bg-background border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Center" : "Add Center"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="center-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="center-name" placeholder="e.g. Jakarta Selatan" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="center-address">
              Address <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input id="center-address" placeholder="e.g. Jl. Sudirman No. 1" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
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
export default function CentersPage() {
  const [centers, setCenters] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { page, limit, goToPage, reset } = usePagination(10);

  const [sorting, setSorting] = useState({ key: "name", order: "asc" });

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await centerService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort_by: sorting.key,
        sort_order: sorting.order,
      });
      setCenters(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load centers");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sorting]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  // Reset page on search change
  useEffect(() => {
    reset();
  }, [debouncedSearch, reset]);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await centerService.deactivate(deactivateTarget.id);
      toast.success(`Center "${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
      fetchCenters();
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
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
      header: "Address",
      accessorKey: "address",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.address ?? <span className="italic opacity-50">—</span>}</span>,
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
      cell: ({ row }) => <span className="text-sm text-muted-foreground tabular-nums">{formatDate(row.original.created_at)}</span>,
    },
    {
      header: "",
      accessorKey: "actions",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditTarget(c);
                setFormOpen(true);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {c.is_active && (
              <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeactivateTarget(c)}>
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
        title="Centers"
        description="Manage all learning centers."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Center
          </Button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={(v) => setSearch(v)} placeholder="Search centers..." className="max-w-xs" />
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total} center{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={centers}
        loading={loading}
        sorting={sorting}
        onSortChange={setSorting}
        emptyTitle="No centers found"
        emptyDescription={debouncedSearch ? `No centers match "${debouncedSearch}"` : "Start by adding a new center."}
      />

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      {/* Create / Edit Dialog */}
      <CenterFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditTarget(null);
        }}
        center={editTarget}
        onSuccess={fetchCenters}
      />

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => {
          if (!v) setDeactivateTarget(null);
        }}
        title="Deactivate Center"
        description={`Are you sure you want to deactivate "${deactivateTarget?.name}"? This will hide it from active operations.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
