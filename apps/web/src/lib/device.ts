import { z } from "zod";

const STORAGE_KEY = "eddie-at-bangmod:device";

const storedDevice = z.object({
  id: z.uuid(),
  nickname: z.string().catch(""),
  seenHowTo: z.boolean().catch(false),
});

/**
 * This browser's anonymous identity, the last Nickname it posted and whether
 * it has seen the how-to Sheet.
 */
export type Device = z.infer<typeof storedDevice>;

// Holds the Device for this page load when browser storage is blocked, so
// every read returns the same Device.
let fallback: Device | undefined;

const listeners = new Set<() => void>();

const readStored = (): Device | undefined => {
  try {
    const stored = storedDevice.safeParse(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")
    );

    return stored.success ? stored.data : fallback;
  } catch {
    return fallback;
  }
};

const write = (device: Device) => {
  fallback = device;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(device));
  } catch {
    // Storage is blocked: the Device lasts for this page load only.
  }
};

// Creating the Device is not a change anyone needs to hear about: it
// happens inside reads, so only edits notify.
const update = (change: Partial<Device>) => {
  write({ ...getDevice(), ...change });

  for (const listener of listeners) {
    listener();
  }
};

/**
 * The Device kept in this browser. The first call creates it. Clearing
 * browser storage makes a new Device (ADR-0001). Client only.
 */
export const getDevice = (): Device => {
  const stored = readStored();

  if (stored) {
    return stored;
  }

  const device = { id: crypto.randomUUID(), nickname: "", seenHowTo: false };
  write(device);

  return device;
};

/** Keeps the last posted Nickname so the next Run fills it in. */
export const saveNickname = (nickname: string) => {
  update({ nickname });
};

/** Records that this Device has seen the how-to Sheet, so it stays hidden. */
export const markHowToSeen = () => {
  update({ seenHowTo: true });
};

/** Calls `onChange` when the stored Device changes, here or in another tab. */
export const subscribeDevice = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};
