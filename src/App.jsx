import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import router from "./router/index.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

export default function App() {
  return (
    // Fix 14: wrap entire app in ErrorBoundary so unhandled render errors
    // show a friendly message instead of a blank white screen.
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton duration={3000} />
    </ErrorBoundary>
  );
}
