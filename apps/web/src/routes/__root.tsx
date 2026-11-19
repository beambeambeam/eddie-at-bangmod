import "@plop-ui/fonts/fonts.css";
import "@plop-ui/react/styles.css";
import { PlopProvider } from "@plop-ui/react";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getTheme, systemThemeScript } from "@/lib/theme";
import type { orpc } from "@/utils/orpc";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

const RootDocument = () => {
  const initialTheme = Route.useLoaderData();

  // Static on purpose: later changes go through applyTheme(), not React props.
  const htmlProps = {
    className: initialTheme === "dark" ? "dark" : undefined,
    "data-plop-theme": initialTheme === "system" ? undefined : initialTheme,
  };

  return (
    <html lang="en" suppressHydrationWarning {...htmlProps}>
      <head>
        <HeadContent />
      </head>
      <body className="plop-surface" style={{ margin: 0, minHeight: "100vh" }}>
        <ThemeProvider initialTheme={initialTheme}>
          <PlopProvider surface="poster" paint={false}>
            <div className="fixed top-4 right-4 z-50">
              <ModeToggle />
            </div>
            <Outlet />
          </PlopProvider>
          <Toaster richColors />
        </ThemeProvider>
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "My App" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{ children: systemThemeScript }],
  }),

  loader: async () => await getTheme(),
  staleTime: Number.POSITIVE_INFINITY,

  component: RootDocument,
});
