import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof DARK_COLORS;
  isDark: boolean;
}

export const DARK_COLORS = {
  bg: "#0A0F1F",
  card: "#1e293b",
  border: "#334155",
  text: "#ffffff",
  textSub: "#94a3b8",
  textMuted: "#64748b",
  primary: "#2563eb",
  accent: "#3b82f6",
};

export const LIGHT_COLORS: typeof DARK_COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textSub: "#475569",
  textMuted: "#94a3b8",
  primary: "#2563eb",
  accent: "#3b82f6",
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  colors: LIGHT_COLORS,
  isDark: false,
});

const STORAGE_KEY = "@healthhub_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark") setTheme(v);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
  const isDark = theme === "dark";


  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
