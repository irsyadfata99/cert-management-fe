import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // UI & styling
          "vendor-ui": [
            "radix-ui",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
            "lucide-react",
            "next-themes",
            "sonner",
            "cmdk",
          ],

          // Charts — lazy-loadable, separate chunk
          "vendor-charts": ["recharts"],

          // Excel export — only used on monitoring pages
          "vendor-excel": ["exceljs"],

          // Table
          "vendor-table": ["@tanstack/react-table"],

          // Forms
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],

          // Misc
          "vendor-misc": ["axios", "zustand", "date-fns", "react-dropzone"],
        },
      },
    },
    // Raise warning threshold slightly since we're now chunked
    chunkSizeWarningLimit: 600,
  },
});
