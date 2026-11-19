import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "eddie-at-bangmod:feedback";

const storedSettings = z.object({
  sound: z.boolean().catch(true),
  haptics: z.boolean().catch(true),
});

/**
 * The sound and haptics switches. The one `PlopProvider` in the root passes
 * them on, so every sound and vibration, the game's and Plop's own, follows
 * them.
 */
export type FeedbackSettings = z.infer<typeof storedSettings>;

// Both are on until a player turns them off: the game's feedback is part of
// playing it, and the toggles in the corner mute it.
const DEFAULTS: FeedbackSettings = { sound: true, haptics: true };

const listeners = new Set<() => void>();
let current: FeedbackSettings | undefined;

const read = (): FeedbackSettings => {
  try {
    const stored = storedSettings.safeParse(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    );

    return stored.success ? stored.data : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

const getSnapshot = () => {
  current ??= read();

  return current;
};

const getServerSnapshot = () => DEFAULTS;

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
  };
};

/** Changes one switch and keeps it for the next visit. */
export const setFeedbackSetting = (
  key: keyof FeedbackSettings,
  value: boolean
) => {
  current = { ...getSnapshot(), [key]: value };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage is blocked: the switch lasts for this page load only.
  }

  for (const listener of listeners) {
    listener();
  }
};

export const useFeedbackSettings = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
