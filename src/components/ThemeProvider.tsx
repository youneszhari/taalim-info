"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ThemeMode } from "@/types/quiz";
import { loadPreferences, savePreferences } from "@/lib/storage";
import { contrastColor } from "@/lib/utils";

const DEFAULT_ACCENT = "#2563EB";

interface ThemeContextValue {
  theme: ThemeMode;
  accent: string;
  ready: boolean;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preferences = loadPreferences();
    setThemeState(preferences.theme ?? systemTheme());
    setAccentState(preferences.accent ?? DEFAULT_ACCENT);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    root.style.setProperty("--accent-color", accent);
    root.style.setProperty("--accent-contrast", contrastColor(accent));
    savePreferences({ theme, accent });
  }, [theme, accent, ready]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const setAccent = useCallback((next: string) => {
    setAccentState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, accent, ready, setTheme, setAccent, toggleTheme }),
    [theme, accent, ready, setTheme, setAccent, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé dans un ThemeProvider.");
  }
  return context;
}
