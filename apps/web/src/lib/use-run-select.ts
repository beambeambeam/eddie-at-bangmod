import { useSyncExternalStore } from "react";

import type { RunLoop, RunView } from "./run-loop";

/**
 * Reads one value from the loop's view and re-renders only when it changes.
 * The loop ticks 60 times a second, so `select` must return a primitive or a
 * reference the snapshot keeps between ticks (such as the Shopping List).
 */
export const useRunSelect = <T>(
  loop: RunLoop,
  select: (view: RunView) => T
): T => {
  const read = () => select(loop.getSnapshot());

  return useSyncExternalStore(loop.subscribe, read, read);
};
