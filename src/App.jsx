import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import router from "./router/index.jsx";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton duration={3000} />
    </>
  );
}
