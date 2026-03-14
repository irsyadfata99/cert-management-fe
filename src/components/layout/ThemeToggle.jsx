import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Read theme preference without side effects — safe for all environments.
const getStoredTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
};

// Apply theme class to <html>. Extracted so it can be called both on
// mount (via useEffect) and on toggle without repeating logic.
const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export default function ThemeToggle({ className }) {
  const [isDark, setIsDark] = useState(() => getStoredTheme() === "dark");

  // Apply the initial theme once on mount (DOM side effect lives here,
  // not inside the useState initializer).
  useEffect(() => {
    applyTheme(isDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = !isDark;
    applyTheme(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
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
