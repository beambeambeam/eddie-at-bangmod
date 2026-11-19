import { z } from "zod";

const STORAGE_KEY = "eddie-at-bangmod:device";

const storedDevice = z.object({
  id: z.uuid(),
  nickname: z.string().catch(""),
});

/** This browser's anonymous identity and the last Nickname it posted. */
export type Device = z.infer<typeof storedDevice>;

// Holds the Device for this page load when browser storage is blocked, so
// every read returns the same Device.
let fallback: Device | undefined;

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

/**
 * The Device kept in this browser. The first call creates it. Clearing
 * browser storage makes a new Device (ADR-0001). Client only.
 */
export const getDevice = (): Device => {
  const stored = readStored();

  if (stored) {
    return stored;
  }

  const device = { id: crypto.randomUUID(), nickname: "" };
  write(device);

  return device;
};

/** Keeps the last posted Nickname so the next Run fills it in. */
export const saveNickname = (nickname: string) => {
  write({ ...getDevice(), nickname });
};

/** Calls `onChange` when another tab changes the stored Device. */
export const subscribeDevice = (onChange: () => void) => {
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener("storage", onChange);
  };
};
