import { appRouter } from "@eddie-at-bangmod/api/routers/index";
import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createRouterClient } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
  environmentManager,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { toast } from "sonner";

import { createContext } from "../context";
import { isLanguage } from "../lib/localization/language";
import { messages } from "../lib/localization/messages";

const MAX_QUERY_RETRIES = 2;

const shouldRetryQuery = (failureCount: number, error: Error) => {
  // Server renders must stay fast and never retry.
  if (environmentManager.isServer()) {
    return false;
  }

  // 4xx errors are deterministic. Retrying cannot fix them.
  if (error instanceof ORPCError && error.status >= 400 && error.status < 500) {
    return false;
  }

  return failureCount < MAX_QUERY_RETRIES;
};

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (_error, query) => {
        // Initial load errors belong to the component (error state or boundary).
        // Toast only when a background refetch fails and stale data is still shown.
        if (environmentManager.isServer() || query.state.data === undefined) {
          return;
        }

        const language = document.documentElement.lang;
        const text = messages[isLanguage(language) ? language : "en"];
        toast.error(text.rankings.retry, {
          action: {
            label: text.retry,
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
    defaultOptions: {
      queries: {
        // > 0 so SSR-hydrated data is not refetched immediately on the client.
        staleTime: 60 * 1000,
        retry: shouldRetryQuery,
      },
    },
  });

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(appRouter, {
      context: () => createContext({ req: getRequest() }),
    })
  )
  .client((): RouterClient<typeof appRouter> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
    });

    return createORPCClient(link);
  });

export const client: RouterClient<typeof appRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);
