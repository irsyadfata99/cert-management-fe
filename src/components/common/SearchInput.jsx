import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SearchInput
 *
 * @param {string} value
 * @param {function} onChange
 * @param {string} placeholder
 * @param {string} className
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-input bg-background",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "transition-all duration-200",
        )}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
