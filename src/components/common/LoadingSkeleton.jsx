import { cn } from "@/lib/utils";

/**
 * Skeleton — single bar
 */
export function Skeleton({ className }) {
  return <div className={cn("skeleton", className)} />;
}

/**
 * TableSkeleton — mimics a table while loading
 *
 * @param {number} rows
 * @param {number} cols
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 px-4 py-3 border-b border-border last:border-0"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={cn("h-4 rounded", colIdx === 0 ? "w-8" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * CardSkeleton — mimics a card
 */
export function CardSkeleton({ className }) {
  return (
    <div className={cn("glass-card p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-1/2 rounded" />
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
    </div>
  );
}

export default TableSkeleton;
