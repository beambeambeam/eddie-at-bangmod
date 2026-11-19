import { createContext, use, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { applyTheme, saveTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const syncSystemTheme = () => {
  applyTheme("system");
};

const watchSystemTheme = () => {
  const query = window.matchMedia("(prefers-color-scheme: dark)");

  query.addEventListener("change", syncSystemTheme);

  return () => {
    query.removeEventListener("change", syncSystemTheme);
  };
};

const ThemeProvider = ({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: ReactNode;
}) => {
  const [theme, setTheme] = useState(initialTheme);

  // Follow OS changes live while in "system" mode.
  useEffect(
    () => (theme === "system" ? watchSystemTheme() : undefined),
    [theme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => {
        // Update the DOM first so the UI never waits on the cookie write.
        applyTheme(next);
        setTheme(next);
        void saveTheme({ data: next });
      },
    }),
    [theme]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
};

const useTheme = () => {
  const context = use(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};

export { ThemeProvider, useTheme };
