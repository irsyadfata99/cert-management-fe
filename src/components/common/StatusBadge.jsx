import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  outline: "bg-muted/50 text-muted-foreground border-border",
  success:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  warning:
    "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
};

const dotClasses = {
  default: "bg-primary",
  secondary: "bg-secondary",
  destructive: "bg-destructive",
  outline: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

/**
 * StatusBadge
 *
 * @param {string} label - Text to display
 * @param {"default"|"secondary"|"destructive"|"outline"|"success"|"warning"|"info"} variant
 * @param {boolean} dot - Show dot indicator
 * @param {string} className
 */
export default function StatusBadge({
  label,
  variant = "default",
  dot = false,
  className,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant] ?? variantClasses.default,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotClasses[variant] ?? dotClasses.default,
          )}
        />
      )}
      {label}
    </span>
  );
}
