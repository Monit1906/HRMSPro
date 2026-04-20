import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  effective: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "hrms_theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(effective: "light" | "dark") {
  const root = document.documentElement;
  if (effective === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
  });

  const [effective, setEffective] = useState<"light" | "dark">(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
    return saved === "system" ? getSystemTheme() : (saved as "light" | "dark");
  });

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    const eff = t === "system" ? getSystemTheme() : t;
    setEffective(eff);
    applyTheme(eff);
  }, []);

  // Listen to system preference changes
  useEffect(() => {
    applyTheme(effective);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const eff = e.matches ? "dark" : "light";
      setEffective(eff);
      applyTheme(eff);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, effective]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effective }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
