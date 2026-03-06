import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Read and apply initial theme before first render
const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved === "dark" || (!saved && prefersDark);

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  return isDark;
};

export default function ThemeToggle({ className }) {
  const [isDark, setIsDark] = useState(getInitialTheme);

  const toggle = () => {
    const next = !isDark;
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(next);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        "transition-all duration-200",
        className,
      )}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
