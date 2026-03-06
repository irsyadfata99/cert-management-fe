import { cn } from "@/lib/utils";

/**
 * PageHeader
 *
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} actions - buttons/controls on the right
 * @param {string} className
 */
export default function PageHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 mb-6", className)}
    >
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
