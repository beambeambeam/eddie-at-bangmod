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
import { useState } from "react";

import { HapticsToggle, SoundToggle } from "@/components/feedback-toggles";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { LanguageSwitch } from "@/components/language-switch";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useFeedbackSettings } from "@/lib/feedback-settings";
import { saveLanguage } from "@/lib/localization/language";
import type { Language } from "@/lib/localization/language";
import { LanguageProvider } from "@/lib/localization/language-provider";
import { getLanguage } from "@/lib/localization/language-request";
import { messages } from "@/lib/localization/messages";
import { getTheme, systemThemeScript } from "@/lib/theme";
import type { orpc } from "@/utils/orpc";

import appCss from "../index.css?url";

export interface RouterAppContext {
  orpc: typeof orpc;
  queryClient: QueryClient;
}

const RootDocument = () => {
  const { theme: initialTheme, language: initialLanguage } =
    Route.useLoaderData();

  const [language, setLanguage] = useState(initialLanguage);
  const { sound, haptics } = useFeedbackSettings();

  // The play screen folds these into its own Settings menu.
  const routeId = useRouterState({
    select: ({ matches }) => matches.at(-1)?.routeId,
  });

  const onPlay = routeId === "/play";
  const text = messages[language];
  let title = "Eddie@Bangmod";

  if (onPlay) {
    title = `${text.marketRun} · Eddie@Bangmod`;
  } else if (routeId === "/leaderboard") {
    title = `${text.leaderboard} · Eddie@Bangmod`;
  }

  const changeLanguage = (choice: Language) => {
    saveLanguage(choice);
    setLanguage(choice);
  };

  // Static on purpose: later changes go through applyTheme(), not React props.
  const htmlProps = {
    className: initialTheme === "dark" ? "dark" : undefined,
    "data-plop-theme": initialTheme === "system" ? undefined : initialTheme,
  };

  return (
    <html lang={language} suppressHydrationWarning {...htmlProps}>
      <head>
        <HeadContent />
        <title>{title}</title>
      </head>
      <body className="plop-surface m-0 min-h-dvh">
        <LanguageProvider language={language} setLanguage={changeLanguage}>
          <ThemeProvider initialTheme={initialTheme}>
            <PlopProvider
              surface="poster"
              paint={false}
              sound={sound}
              haptics={haptics}
            >
              {!onPlay && (
                <div className="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-2">
                  <LanguageSwitch />
                  <SoundToggle />
                  <HapticsToggle />
                  <FullscreenToggle />
                  <ModeToggle />
                </div>
              )}
              <Outlet />
            </PlopProvider>
            <Toaster richColors containerAriaLabel={text.notifications} />
          </ThemeProvider>
        </LanguageProvider>
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
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [{ children: systemThemeScript }],
  }),

  loader: async () => {
    const [theme, language] = await Promise.all([getTheme(), getLanguage()]);

    return { theme, language };
  },
  staleTime: Number.POSITIVE_INFINITY,

  component: RootDocument,
});
