import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MultiSelect — shadcn style
 *
 * @param {Array<{value: string, label: string}>} options
 * @param {string[]} value - array of selected values
 * @param {function} onChange - (values: string[]) => void
 * @param {string} placeholder
 * @param {string} emptyText - shown when no options match search
 * @param {boolean} disabled
 * @param {string} className
 */
export default function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options...",
  emptyText = "No options found.",
  disabled = false,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const remove = (e, val) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const selectedLabels = value.map(
    (v) => options.find((o) => o.value === v)?.label ?? v,
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "min-h-9 w-full flex items-center gap-1.5 flex-wrap px-3 py-1.5 rounded-md border border-input bg-background text-sm cursor-pointer",
          "transition-all duration-200",
          open && "ring-2 ring-ring border-transparent",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selectedLabels.map((label, i) => (
            <span
              key={value[i]}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs font-medium"
            >
              {label}
              <button
                onClick={(e) => remove(e, value[i])}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground ml-auto shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md animate-scale-in">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                {emptyText}
              </li>
            ) : (
              filtered.map((option) => {
                const selected = value.includes(option.value);
                return (
                  <li
                    key={option.value}
                    onClick={() => toggle(option.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-sm text-sm cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground transition-colors",
                      selected && "text-primary",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                        selected
                          ? "bg-primary border-primary"
                          : "border-input bg-background",
                      )}
                    >
                      {selected && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    {option.label}
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer */}
          {value.length > 0 && (
            <div className="p-2 border-t border-border">
              <button
                onClick={() => onChange([])}
                className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors text-center"
              >
                Clear all ({value.length} selected)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
