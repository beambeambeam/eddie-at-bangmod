import { beforeEach, expect, test, vi } from "vite-plus/test";

/** A stand-in browser store, wiped before each test. */
const makeStorage = () => {
  const data = new Map<string, string>();

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("localStorage", makeStorage());
  vi.stubGlobal("window", new EventTarget());
});

const loadDevice = async () => await import("./device");

test("a new Device has not seen the how-to", async () => {
  const { getDevice } = await loadDevice();

  expect(getDevice().seenHowTo).toBe(false);
});

test("once marked, the Device has seen the how-to on every later visit", async () => {
  const first = await loadDevice();
  first.markHowToSeen();

  // A new page load: the module state is gone, only browser storage is left.
  vi.resetModules();
  const later = await loadDevice();

  expect(later.getDevice().seenHowTo).toBe(true);
});

test("marking the how-to seen keeps the Device id and Nickname", async () => {
  const { getDevice, saveNickname, markHowToSeen } = await loadDevice();
  const { id } = getDevice();
  saveNickname("Eddie");

  markHowToSeen();

  expect(getDevice()).toEqual({ id, nickname: "Eddie", seenHowTo: true });
});

test("saving a Nickname keeps the how-to flag", async () => {
  const { getDevice, saveNickname, markHowToSeen } = await loadDevice();
  markHowToSeen();

  saveNickname("Eddie");

  expect(getDevice().seenHowTo).toBe(true);
});

test("subscribers hear about a change made in the same tab", async () => {
  const { markHowToSeen, subscribeDevice } = await loadDevice();
  const onChange = vi.fn<() => void>();
  const unsubscribe = subscribeDevice(onChange);

  markHowToSeen();
  expect(onChange).toHaveBeenCalledTimes(1);

  unsubscribe();
  markHowToSeen();
  expect(onChange).toHaveBeenCalledTimes(1);
});

test("a stored Device from before the how-to has not seen it", async () => {
  const id = crypto.randomUUID();

  localStorage.setItem(
    "eddie-at-bangmod:device",
    JSON.stringify({ id, nickname: "Eddie" })
  );
  const { getDevice } = await loadDevice();

  expect(getDevice()).toEqual({ id, nickname: "Eddie", seenHowTo: false });
});
