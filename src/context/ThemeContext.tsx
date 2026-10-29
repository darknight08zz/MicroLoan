"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  useEffect,
  ReactNode,
} from "react";

export type Theme = "dark" | "light";

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  mounted: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = "microloan_theme";
const DEFAULT_THEME: Theme = "light";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const emptySubscribe = () => () => {};

const themeListeners = new Set<() => void>();
function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}
function notifyThemeListeners() {
  for (const listener of themeListeners) {
    listener();
  }
}

function getClientThemeSnapshot(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return DEFAULT_THEME;
  }
}

function getServerThemeSnapshot(): Theme {
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getClientThemeSnapshot, getServerThemeSnapshot);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Apply theme class to document root element
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, []);

  // Update theme and persist to localStorage
  const setTheme = useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (err) {
        console.warn("Could not save theme preference:", err);
      }
      applyTheme(newTheme);
      notifyThemeListeners();
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Initial sync on mount to ensure DOM attribute matches
  useEffect(() => {
    applyTheme(getClientThemeSnapshot());
  }, [applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        mounted,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
