import { useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import useAuth from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Derive page title from pathname
const getPageTitle = (pathname) => {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Get initials from email — e.g. "john.doe@gmail.com" → "JD"
const getInitials = (email) => {
  if (!email) return "?";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const initials = getInitials(user?.email);

  return (
    <header className="glass-navbar h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      {/* Page title */}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border ml-1">
          {/* Avatar — initials only */}
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 ring-2 ring-border">
            <span className="text-xs font-semibold text-primary leading-none">{initials}</span>
          </div>

          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-foreground leading-none">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role?.replace("_", " ") ?? ""}</p>
          </div>

          {/* Logout */}
          <button onClick={logout} className={cn("ml-1 w-8 h-8 rounded-lg flex items-center justify-center", "text-muted-foreground hover:text-destructive hover:bg-destructive/10", "transition-all duration-200")} aria-label="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
