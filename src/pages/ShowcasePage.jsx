import { useState } from "react";
import {
  FileX,
  Package,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";

// ── Common Components ──
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";
import DataTable from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import {
  TableSkeleton,
  CardSkeleton,
  Skeleton,
} from "@/components/common/LoadingSkeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";

// ── Shadcn UI ──
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// ── Custom UI ──
import MultiSelect from "@/components/ui/multi-select";

// ── Utils ──
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatMonth,
} from "@/utils/formatDate";
import {
  formatEnrollmentStatus,
  formatUploadStatus,
  formatActiveStatus,
  formatStockAlert,
  formatUploadBoolean,
} from "@/utils/formatStatus";

// ── ThemeToggle ──
import ThemeToggle from "@/components/layout/ThemeToggle";

// ─────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Separator className="mt-2" />
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {label && (
        <span className="text-xs text-muted-foreground w-36 shrink-0">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sample DataTable data
// ─────────────────────────────────────────────
const TABLE_COLUMNS = [
  { header: "Name", accessorKey: "name", sortKey: "name" },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const { label, variant } = formatActiveStatus(row.original.is_active);
      return <StatusBadge label={label} variant={variant} dot />;
    },
  },
  {
    header: "Enrollment",
    accessorKey: "enrollment",
    cell: ({ row }) => {
      const { label, variant } = formatEnrollmentStatus(
        row.original.enrollment,
      );
      return <StatusBadge label={label} variant={variant} />;
    },
  },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }) => formatDate(row.original.date),
  },
];

const TABLE_DATA = [
  {
    name: "Alice Johnson",
    is_active: true,
    enrollment: "complete",
    date: "2025-01-15",
  },
  {
    name: "Bob Smith",
    is_active: true,
    enrollment: "scan_uploaded",
    date: "2025-02-20",
  },
  {
    name: "Carol White",
    is_active: false,
    enrollment: "pending",
    date: "2025-03-05",
  },
  {
    name: "David Brown",
    is_active: true,
    enrollment: "cert_printed",
    date: "2025-04-10",
  },
];

const THREE_HOURS_AGO = new Date(Date.now() - 1000 * 60 * 60 * 3);

const MULTI_OPTIONS = [
  { value: "math", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "english", label: "English" },
  { value: "coding", label: "Coding" },
  { value: "art", label: "Art" },
];

// ─────────────────────────────────────────────
// Main Showcase Page
// ─────────────────────────────────────────────
export default function ShowcasePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(3);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [sorting, setSorting] = useState({ key: "name", order: "asc" });
  const [multiValue, setMultiValue] = useState(["math", "coding"]);
  const [checked, setChecked] = useState(true);

  const handleConfirm = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }, 1500);
  };

  const handleSort = (key) => {
    setSorting((prev) =>
      prev.key === key
        ? { key, order: prev.order === "asc" ? "desc" : "asc" }
        : { key, order: "asc" },
    );
  };

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-12">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Component Showcase
            </h1>
            <p className="text-muted-foreground mt-1">
              All components in one place for review before implementation.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* ── 1. Buttons ── */}
        <Section title="Button">
          <Row label="Variants">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </Row>
          <Row label="States">
            <Button disabled>Disabled</Button>
            <Button>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
              Loading
            </Button>
          </Row>
        </Section>

        <Separator />

        {/* ── 2. Input & Label ── */}
        <Section title="Input & Label">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter name..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disabled">Disabled</Label>
              <Input id="disabled" placeholder="Disabled input" disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-demo">Search Input (custom)</Label>
              <SearchInput
                id="search-demo"
                value={search}
                onChange={setSearch}
                placeholder="Search students..."
              />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 3. Select & MultiSelect ── */}
        <Section title="Select & MultiSelect">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="space-y-1.5">
              <Label>Single Select</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Multi Select (custom)</Label>
              <MultiSelect
                options={MULTI_OPTIONS}
                value={multiValue}
                onChange={setMultiValue}
                placeholder="Select modules..."
              />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 4. Checkbox ── */}
        <Section title="Checkbox">
          <Row>
            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={checked}
                onCheckedChange={setChecked}
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="disabled-check" disabled />
              <Label htmlFor="disabled-check" className="text-muted-foreground">
                Disabled
              </Label>
            </div>
          </Row>
        </Section>

        <Separator />

        {/* ── 5. Badge & StatusBadge ── */}
        <Section title="Badge & StatusBadge">
          <Row label="Shadcn Badge">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Row>
          <Row label="StatusBadge">
            <StatusBadge label="Active" variant="success" dot />
            <StatusBadge label="Inactive" variant="outline" dot />
            <StatusBadge label="Low Stock" variant="destructive" dot />
            <StatusBadge label="Pending" variant="outline" />
            <StatusBadge label="Complete" variant="success" />
            <StatusBadge label="Partial" variant="warning" />
            <StatusBadge label="Missing" variant="destructive" />
            <StatusBadge label="Info" variant="info" />
          </Row>
          <Row label="From formatStatus">
            {[
              formatEnrollmentStatus("pending"),
              formatEnrollmentStatus("cert_printed"),
              formatEnrollmentStatus("scan_uploaded"),
              formatEnrollmentStatus("complete"),
              formatUploadStatus("missing"),
              formatActiveStatus(true),
              formatStockAlert(true),
              formatUploadBoolean(false),
            ].map(({ label, variant }, i) => (
              <StatusBadge key={i} label={label} variant={variant} dot />
            ))}
          </Row>
        </Section>

        <Separator />

        {/* ── 6. Card ── */}
        <Section title="Card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>Total active students</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">128</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Certificates</CardTitle>
                <CardDescription>Printed this month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">47</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stock Alert</CardTitle>
                <CardDescription>Centers with low stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-destructive">3</p>
                  <StatusBadge label="Low Stock" variant="destructive" dot />
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Separator />

        {/* ── 7. Tooltip ── */}
        <Section title="Tooltip">
          <Row>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>This is a tooltip</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </Row>
        </Section>

        <Separator />

        {/* ── 8. Dropdown Menu ── */}
        <Section title="Dropdown Menu">
          <Row>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <MoreHorizontal className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" /> View
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Deactivate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Row>
        </Section>

        <Separator />

        {/* ── 9. Dialog ── */}
        <Section title="Dialog">
          <Row>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to register a new student.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input placeholder="Enter student name..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Module</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="math">Mathematics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Save</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Row>
        </Section>

        <Separator />

        {/* ── 10. AlertDialog & ConfirmDialog ── */}
        <Section title="AlertDialog & ConfirmDialog">
          <Row>
            {/* Shadcn AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Shadcn AlertDialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Custom ConfirmDialog */}
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Custom ConfirmDialog
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Deactivate Student?"
              description="This student will be deactivated and won't appear in active lists."
              confirmLabel="Deactivate"
              variant="destructive"
              onConfirm={handleConfirm}
              loading={confirmLoading}
            />
          </Row>
        </Section>

        <Separator />

        {/* ── 11. PageHeader ── */}
        <Section title="PageHeader">
          <div className="border border-border rounded-lg p-4 bg-background">
            <PageHeader
              title="Students"
              description="Manage all students across your center."
              actions={
                <>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search..."
                    className="w-48"
                  />
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Student
                  </Button>
                </>
              }
            />
          </div>
        </Section>

        <Separator />

        {/* ── 12. DataTable ── */}
        <Section title="DataTable">
          <p className="text-xs text-muted-foreground">
            Click column headers to sort. Resize window to see mobile card view.
          </p>
          <div className="glass-card p-4">
            <DataTable
              columns={TABLE_COLUMNS}
              data={TABLE_DATA}
              sorting={sorting}
              onSortChange={handleSort}
              emptyTitle="No students found"
            />
          </div>
          <div className="glass-card p-4">
            <p className="text-sm font-medium mb-3 text-muted-foreground">
              Empty state:
            </p>
            <DataTable
              columns={TABLE_COLUMNS}
              data={[]}
              emptyTitle="No students found"
              emptyDescription="Try adjusting your search or filters."
            />
          </div>
          <div className="glass-card p-4">
            <p className="text-sm font-medium mb-3 text-muted-foreground">
              Loading state:
            </p>
            <DataTable columns={TABLE_COLUMNS} data={[]} loading={true} />
          </div>
        </Section>

        <Separator />

        {/* ── 13. Pagination ── */}
        <Section title="Pagination">
          <Row label="Page 3 of 10">
            <Pagination page={page} totalPages={10} onPageChange={setPage} />
          </Row>
          <Row label="Page 1 of 3">
            <Pagination page={1} totalPages={3} onPageChange={() => {}} />
          </Row>
          <Row label="Single page (hidden)">
            <span className="text-xs text-muted-foreground italic">
              Nothing rendered when totalPages ≤ 1
            </span>
            <Pagination page={1} totalPages={1} onPageChange={() => {}} />
          </Row>
        </Section>

        <Separator />

        {/* ── 14. EmptyState ── */}
        <Section title="EmptyState">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg bg-background">
              <EmptyState
                icon={FileX}
                title="No enrollments found"
                description="Try adjusting your search or filters."
                action={
                  <Button size="sm" variant="outline">
                    Reset Filters
                  </Button>
                }
              />
            </div>
            <div className="border border-border rounded-lg bg-background">
              <EmptyState
                icon={Package}
                title="No stock data"
                description="Stock information is not available for this center."
              />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 15. LoadingSkeleton ── */}
        <Section title="LoadingSkeleton">
          <Row label="Single Skeleton">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </Row>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              TableSkeleton (5 rows, 4 cols):
            </p>
            <div className="border border-border rounded-lg overflow-hidden bg-background">
              <TableSkeleton rows={3} cols={4} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </Section>

        <Separator />

        {/* ── 16. Utils: formatDate ── */}
        <Section title="Utils — formatDate">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm max-w-lg">
            {[
              ["formatDate", formatDate("2025-06-15T08:30:00Z")],
              ["formatDateTime", formatDateTime("2025-06-15T08:30:00Z")],
              ["formatRelative", formatRelative(THREE_HOURS_AGO)],
              ["formatMonth", formatMonth("2025-06-01")],
              ["null/undefined", formatDate(null)],
            ].map(([fn, result]) => (
              <div
                key={fn}
                className="flex items-center gap-3 p-2 rounded-md bg-muted/40"
              >
                <code className="text-xs text-primary w-36 shrink-0">
                  {fn}()
                </code>
                <span className="text-foreground">{result}</span>
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        {/* ── 17. Utils: formatStatus ── */}
        <Section title="Utils — formatStatus">
          <div className="flex flex-wrap gap-2">
            {[
              formatEnrollmentStatus("pending"),
              formatEnrollmentStatus("cert_printed"),
              formatEnrollmentStatus("scan_uploaded"),
              formatEnrollmentStatus("report_uploaded"),
              formatEnrollmentStatus("complete"),
              formatUploadStatus("complete"),
              formatUploadStatus("partial"),
              formatUploadStatus("missing"),
              formatActiveStatus(true),
              formatActiveStatus(false),
              formatStockAlert(true),
              formatStockAlert(false),
              formatUploadBoolean(true),
              formatUploadBoolean(false),
            ].map(({ label, variant }, i) => (
              <StatusBadge key={i} label={label} variant={variant} dot />
            ))}
          </div>
        </Section>

        <Separator />

        {/* ── 18. ThemeToggle ── */}
        <Section title="ThemeToggle">
          <Row label="Toggle theme">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              Click to switch light/dark
            </span>
          </Row>
        </Section>
      </div>
    </TooltipProvider>
  );
}
