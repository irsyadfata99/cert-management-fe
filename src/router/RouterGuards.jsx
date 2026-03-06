import { useEffect, useState, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

// ─────────────────────────────────────────────
// Full screen loader
// ─────────────────────────────────────────────
export function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Redirect root → halaman sesuai role
// ─────────────────────────────────────────────
export function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;

  const redirectMap = {
    super_admin: "/super-admin/dashboard",
    admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
  };

  return <Navigate to={redirectMap[user.role] || "/login"} replace />;
}

// ─────────────────────────────────────────────
// Guard: cek session aktif sebelum render
// ─────────────────────────────────────────────
export function AuthGuard() {
  const { isAuthenticated, fetchMe } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchMe().finally(() => setChecking(false));
  }, [fetchMe]);

  if (checking) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// ─────────────────────────────────────────────
// Guard: batasi akses berdasarkan role
// ─────────────────────────────────────────────
export function RoleGuard({ roles }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
