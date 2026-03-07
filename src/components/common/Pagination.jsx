import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIBLINGS = 1; // pages shown on each side of current

function getPageRange(current, total) {
  const delta = PAGE_SIBLINGS;
  const range = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }

  if (current - delta > 2) range.unshift("...");
  if (current + delta < total - 1) range.push("...");

  range.unshift(1);
  if (total > 1) range.push(total);

  return range;
}

function PageButton({ page, current, onClick }) {
  const isActive = page === current;
  return (
    <button
      onClick={() => onClick(page)}
      className={cn(
        "w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 border",
        isActive ? "bg-primary text-primary-foreground border-primary shadow-sm" : "text-foreground border-border bg-background hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {page}
    </button>
  );
}

/**
 * Pagination
 *
 * @param {number} page - current page (1-based)
 * @param {number} totalPages
 * @param {function} onPageChange
 * @param {string} className
 */
export default function Pagination({ page, totalPages, onPageChange, className }) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(page, totalPages);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 border",
          page === 1 ? "text-muted-foreground/40 border-border/40 cursor-not-allowed" : "text-foreground border-border bg-background hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </span>
        ) : (
          <PageButton key={p} page={p} current={page} onClick={onPageChange} />
        ),
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 border",
          page === totalPages ? "text-muted-foreground/40 border-border/40 cursor-not-allowed" : "text-foreground border-border bg-background hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
