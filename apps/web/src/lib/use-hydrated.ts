import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  // Hydration only changes which snapshot React reads.
};

export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
