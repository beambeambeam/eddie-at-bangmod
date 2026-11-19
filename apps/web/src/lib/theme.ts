import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const THEME_COOKIE = "theme";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const themeSchema = z.enum(["light", "dark", "system"]);

export type Theme = z.infer<typeof themeSchema>;

/** Reads the saved theme on the server so the first HTML paint is correct. */
export const getTheme = createServerFn().handler((): Theme => {
  const parsed = themeSchema.safeParse(getCookie(THEME_COOKIE));

  return parsed.success ? parsed.data : "system";
});

export const saveTheme = createServerFn({ method: "POST" })
  .validator(themeSchema)
  .handler(({ data }) => {
    setCookie(THEME_COOKIE, data, {
      maxAge: ONE_YEAR_SECONDS,
      path: "/",
      sameSite: "lax",
    });
  });

/**
 * Runs in <head> before first paint. Only matters for "system": the server
 * cannot know the OS preference, so add `.dark` when no explicit cookie exists.
 */
export const systemThemeScript = `(function(){if(/(?:^|; )theme=(?:light|dark)/.test(document.cookie))return;if(window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.add("dark")})()`;

/** Mirrors the theme onto <html>: `.dark` for shadcn tokens, `data-plop-theme` for Plop UI. */
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);

  if (theme === "system") {
    delete root.dataset.plopTheme;
  } else {
    root.dataset.plopTheme = theme;
  }
};
