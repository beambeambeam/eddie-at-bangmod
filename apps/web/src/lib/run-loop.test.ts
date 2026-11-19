import { TICKS_PER_SECOND } from "@eddie-at-bangmod/game";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { createRunLoop } from "./run-loop";

const COUNTDOWN_MS = 3000;
const STILL = { x: 0, y: 0 };

/** A stand-in page whose visibility the test flips. */
const page = Object.assign(new EventTarget(), { hidden: false });

const setHidden = (hidden: boolean) => {
  page.hidden = hidden;
  page.dispatchEvent(new Event("visibilitychange"));
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("document", page);
  // Node has no animation frames, so a fake 60 Hz frame clock stands in.
  vi.stubGlobal("requestAnimationFrame", (draw: FrameRequestCallback) =>
    setTimeout(() => {
      draw(performance.now());
    }, 16)
  );
  vi.stubGlobal("cancelAnimationFrame", (frame: number) => {
    clearTimeout(frame);
  });
  page.hidden = false;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("hiding the page pauses the Run, and no ticks pass while it is hidden", () => {
  const loop = createRunLoop(1, () => STILL);
  const stop = loop.start();
  vi.advanceTimersByTime(COUNTDOWN_MS + 1000);
  const before = loop.getSnapshot().run.tick;
  expect(loop.getSnapshot().stage).toBe("running");

  setHidden(true);
  vi.advanceTimersByTime(30_000);
  expect(loop.getSnapshot().run.tick).toBe(before);

  setHidden(false);
  vi.advanceTimersByTime(1000);
  const after = loop.getSnapshot().run.tick;
  expect(after - before).toBeGreaterThan(TICKS_PER_SECOND - 5);
  expect(after - before).toBeLessThanOrEqual(TICKS_PER_SECOND + 1);

  stop();
});
