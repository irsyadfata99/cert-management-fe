import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import { FileX } from "lucide-react";

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription = "Try adjusting your search or filters.",
  sorting,
  onSortChange,
  className,
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  const SortIcon = ({ columnKey }) => {
    if (!onSortChange) return null;
    if (sorting?.key !== columnKey)
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sorting.order === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  if (loading) return <TableSkeleton rows={5} cols={columns.length} />;

  if (!data.length) {
    return (
      <EmptyState
        icon={FileX}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* ── Desktop Table ── */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border bg-muted/40"
              >
                {headerGroup.headers.map((header) => {
                  const sortKey = header.column.columnDef.sortKey;
                  const canSort = !!sortKey && !!onSortChange;
                  return (
                    <th
                      key={header.id}
                      onClick={() => canSort && onSortChange(sortKey)}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap",
                        canSort &&
                          "cursor-pointer select-none hover:text-foreground transition-colors",
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && <SortIcon columnKey={sortKey} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  "hover:bg-accent/40",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card List ── */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className="glass-card p-4 space-y-2">
            {row.getVisibleCells().map((cell) => {
              const header = cell.column.columnDef.header;
              const label =
                typeof header === "string" ? header : cell.column.id;
              return (
                <div
                  key={cell.id}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
                    {label}
                  </span>
                  <span className="text-right text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
