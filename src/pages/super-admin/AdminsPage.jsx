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
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import DataTable from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import Pagination from "@/components/common/Pagination";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import adminService from "@/services/adminService";
import { formatDate } from "@/utils/formatDate";
import { formatActiveStatus } from "@/utils/formatStatus";
import { toast } from "sonner";
import useDebounce from "@/hooks/useDebounce";
import usePagination from "@/hooks/usePagination";

// ── Form Dialog (Create / Edit) ─────────────────────────────
function AdminFormDialog({ open, onOpenChange, admin, onSuccess }) {
  const isEdit = !!admin;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(admin?.name ?? "");
      setEmail(admin?.email ?? "");
    }
  }, [open, admin]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await adminService.update(admin.id, {
          name: name.trim(),
          ...(email.trim() !== admin.email ? { email: email.trim() } : {}),
        });
        toast.success("Admin updated");
      } else {
        await adminService.create({ name: name.trim(), email: email.trim() });
        toast.success("Admin created — they can now login with Google");
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
          <DialogTitle>{isEdit ? "Edit Admin" : "Add Admin"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="admin-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="admin-name"
              placeholder="e.g. Budi Santoso"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">
              Email <span className="text-destructive">*</span>
              {isEdit && (
                <span className="text-xs text-muted-foreground ml-1">
                  (changing email will deactivate account)
                </span>
              )}
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="e.g. budi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const { page, limit, goToPage, reset } = usePagination(10);
  const [sorting, setSorting] = useState({ key: "name", order: "asc" });

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        sort_by: sorting.key,
        sort_order: sorting.order,
      });
      setAdmins(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sorting]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);
  useEffect(() => {
    reset();
  }, [debouncedSearch, reset]);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await adminService.deactivate(deactivateTarget.id);
      toast.success(`Admin "${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
      fetchAdmins();
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
      header: "Email",
      accessorKey: "email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.email}
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
        const a = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditTarget(a);
                setFormOpen(true);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {a.is_active && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeactivateTarget(a)}
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
        title="Admins"
        description="Manage admin accounts."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search admins..."
          className="max-w-xs"
        />
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {total} admin{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={admins}
        loading={loading}
        sorting={sorting}
        onSortChange={setSorting}
        emptyTitle="No admins found"
        emptyDescription={
          debouncedSearch
            ? `No admins match "${debouncedSearch}"`
            : "Start by adding a new admin."
        }
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      <AdminFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditTarget(null);
        }}
        admin={editTarget}
        onSuccess={fetchAdmins}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(v) => {
          if (!v) setDeactivateTarget(null);
        }}
        title="Deactivate Admin"
        description={`Are you sure you want to deactivate "${deactivateTarget?.name}"? They will no longer be able to login.`}
        confirmLabel="Deactivate"
        variant="destructive"
        loading={deactivating}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
