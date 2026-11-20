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
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { HapticsToggle, SoundToggle } from "@/components/feedback-toggles";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useFeedbackSettings } from "@/lib/feedback-settings";
import { getTheme, systemThemeScript } from "@/lib/theme";
import type { orpc } from "@/utils/orpc";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

const RootDocument = () => {
  const initialTheme = Route.useLoaderData();
  const { sound, haptics } = useFeedbackSettings();

  // The play screen folds these into its own Settings menu.
  const onPlay = useRouterState({
    select: ({ location }) => location.pathname === "/play",
  });

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
      <body className="plop-surface m-0 min-h-dvh">
        <ThemeProvider initialTheme={initialTheme}>
          <PlopProvider
            surface="poster"
            paint={false}
            sound={sound}
            haptics={haptics}
          >
            {!onPlay && (
              <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex items-center gap-2">
                <SoundToggle />
                <HapticsToggle />
                <FullscreenToggle />
                <ModeToggle />
              </div>
            )}
            <Outlet />
          </PlopProvider>
          <Toaster richColors />
        </ThemeProvider>
        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools
              position="bottom"
              buttonPosition="bottom-right"
            />
          </>
        )}
        <Scripts />
      </body>
    </html>
  );
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        // `viewport-fit=cover` lets the page reach under notches; the
        // safe-area padding keeps controls clear of them.
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Eddie@Bangmod" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [{ children: systemThemeScript }],
  }),

  loader: async () => await getTheme(),
  staleTime: Number.POSITIVE_INFINITY,

  component: RootDocument,
});
