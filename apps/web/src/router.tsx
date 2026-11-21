import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { useLanguage } from "./lib/localization/language-provider";
import { routeTree } from "./routeTree.gen";
import { createQueryClient, orpc } from "./utils/orpc";

const NotFound = () => {
  const { text } = useLanguage();

  return <main className="px-4 py-16">{text.notFound}</main>;
};

export const getRouter = () => {
  const queryClient = createQueryClient();

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { orpc, queryClient },
    defaultNotFoundComponent: NotFound,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
