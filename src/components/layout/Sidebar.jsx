import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart3,
  Building2,
  ShieldCheck,
  Printer,
  History,
  Award,
  Package,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";

// ── Menu definitions per role ──────────────────────────────
const MENUS = {
  super_admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/super-admin/dashboard" },
    { label: "Centers", icon: Building2, to: "/super-admin/centers" },
    { label: "Admins", icon: ShieldCheck, to: "/super-admin/admins" },
    { label: "Monitoring", icon: BarChart3, to: "/super-admin/monitoring" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Stock", icon: Package, to: "/admin/stock" },
    { label: "Students", icon: GraduationCap, to: "/admin/students" },
    { label: "Teachers", icon: Users, to: "/admin/teachers" },
    { label: "Modules", icon: BookOpen, to: "/admin/modules" },
    { label: "Enrollments", icon: ClipboardList, to: "/admin/enrollments" },
    { label: "Monitoring", icon: BarChart3, to: "/admin/monitoring" },
  ],
  teacher: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/teacher/dashboard" },
    { label: "Print", icon: Printer, to: "/teacher/print" },
    { label: "Final Report", icon: FileText, to: "/teacher/final-report" },
    { label: "History", icon: History, to: "/teacher/history" },
  ],
};

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )
      }
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const menus = MENUS[user?.role] ?? [];

  return (
    <aside className="glass-sidebar w-64 shrink-0 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Award className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">CertifyPro</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role?.replace("_", " ") ?? ""}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menus.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* Center info */}
      {user?.role !== "super_admin" && user?.center_id && (
        <div className="px-4 py-3 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground">Center</span> ·{" "}
            {user.center_id}
          </p>
        </div>
      )}
    </aside>
  );
}
