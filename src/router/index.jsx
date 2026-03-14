import { createBrowserRouter } from "react-router-dom";
import { AuthGuard, RoleGuard, RoleRedirect } from "./RouterGuards";

// ── Layouts ──
import AppLayout from "../components/layout/AppLayout";

// ── Auth Pages ──
import LoginPage from "../pages/auth/LoginPage";

// ── Super Admin Pages ──
import SuperDashboard from "../pages/super-admin/DashboardPage";
import CentersPage from "../pages/super-admin/CentersPage";
import AdminsPage from "../pages/super-admin/AdminsPage";
import SuperMonitoringPage from "../pages/super-admin/MonitoringPage";

// ── Admin Pages ──
import AdminDashboard from "../pages/admin/DashboardPage";
import StudentsPage from "../pages/admin/StudentsPage";
import TeachersPage from "../pages/admin/TeachersPage";
import ModulesPage from "../pages/admin/ModulesPage";
import EnrollmentsPage from "../pages/admin/EnrollmentsPage";
import AdminMonitoringPage from "../pages/admin/MonitoringPage";
import StockPage from "../pages/admin/StockPage";

// ── Teacher Pages ──
import TeacherDashboard from "../pages/teacher/DashboardPage";
import PrintPage from "../pages/teacher/PrintPage";
import FinalReportPage from "../pages/teacher/FinalReportPage";
import HistoryPage from "../pages/teacher/HistoryPage";

// ── Misc Pages ──
import NotFoundPage from "../pages/NotFoundPage";
import ShowcasePage from "../pages/ShowcasePage";

const router = createBrowserRouter([
  // ── Public ──
  { path: "/login", element: <LoginPage /> },
  { path: "/showcase", element: <ShowcasePage /> },

  // ── Protected ──
  {
    element: <AuthGuard />,
    children: [
      { path: "/", element: <RoleRedirect /> },

      // ── Super Admin ──
      {
        element: <RoleGuard roles={["super_admin"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/super-admin/dashboard", element: <SuperDashboard /> },
              { path: "/super-admin/centers", element: <CentersPage /> },
              { path: "/super-admin/admins", element: <AdminsPage /> },
              {
                path: "/super-admin/monitoring",
                element: <SuperMonitoringPage />,
              },
            ],
          },
        ],
      },

      // ── Admin ──
      {
        element: <RoleGuard roles={["admin"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/admin/dashboard", element: <AdminDashboard /> },
              { path: "/admin/stock", element: <StockPage /> },
              { path: "/admin/students", element: <StudentsPage /> },
              { path: "/admin/teachers", element: <TeachersPage /> },
              { path: "/admin/modules", element: <ModulesPage /> },
              { path: "/admin/enrollments", element: <EnrollmentsPage /> },
              { path: "/admin/monitoring", element: <AdminMonitoringPage /> },
            ],
          },
        ],
      },

      // ── Teacher ──
      {
        element: <RoleGuard roles={["teacher"]} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "/teacher/dashboard", element: <TeacherDashboard /> },
              { path: "/teacher/print", element: <PrintPage /> },
              { path: "/teacher/final-report", element: <FinalReportPage /> },
              { path: "/teacher/history", element: <HistoryPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ── 404 ──
  { path: "*", element: <NotFoundPage /> },
]);

export default router;
