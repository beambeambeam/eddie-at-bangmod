import { TICKS_PER_SECOND } from "@eddie-at-bangmod/game";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { createRunLoop } from "./run-loop";
import type { LoopEvent } from "./run-loop";

const COUNTDOWN_MS = 3000;
const RUN_MS = 90_000;
const STILL = { move: { x: 0, y: 0 }, sprint: false };

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

test("a stalled frame moves the Run at most 3 ticks, so Eddie never jumps", () => {
  let gap = 16;
  vi.stubGlobal("requestAnimationFrame", (draw: FrameRequestCallback) =>
    setTimeout(() => {
      draw(performance.now());
    }, gap)
  );
  const loop = createRunLoop(1, () => STILL);
  const stop = loop.start();
  vi.advanceTimersByTime(COUNTDOWN_MS + 1000);
  expect(loop.getSnapshot().stage).toBe("running");

  gap = 500;
  vi.advanceTimersByTime(16);
  const before = loop.getSnapshot().run.tick;
  vi.advanceTimersByTime(500);
  expect(loop.getSnapshot().run.tick - before).toBeLessThanOrEqual(3);

  stop();
});

/** Collects every event the loop publishes, in order. */
const record = (loop: ReturnType<typeof createRunLoop>) => {
  const events: LoopEvent[] = [];

  loop.subscribeEvents((batch) => {
    events.push(...batch);
  });

  return events;
};

test("the countdown ticks 3, 2, 1 once each, then the Run starts", () => {
  const loop = createRunLoop(1, () => STILL);
  const events = record(loop);
  const stop = loop.start();

  vi.advanceTimersByTime(COUNTDOWN_MS + 500);

  expect(events.slice(0, 4)).toEqual([
    { type: "countdown-tick", count: 3 },
    { type: "countdown-tick", count: 2 },
    { type: "countdown-tick", count: 1 },
    { type: "run-started" },
  ]);
  expect(events.filter((event) => event.type === "run-started")).toHaveLength(
    1
  );

  stop();
});

test("the events of the game pass through once: Phase changes, then the end", () => {
  const loop = createRunLoop(1, () => STILL);
  const events = record(loop);
  const stop = loop.start();

  vi.advanceTimersByTime(COUNTDOWN_MS + RUN_MS + 1000);

  expect(
    events.filter(
      (event) => event.type === "phase-changed" || event.type === "run-ended"
    )
  ).toEqual([
    { type: "phase-changed", phase: 2 },
    { type: "phase-changed", phase: 3 },
    { type: "run-ended" },
  ]);

  stop();
});

test("a listener that unsubscribed hears nothing more", () => {
  const loop = createRunLoop(1, () => STILL);
  const heard = vi.fn<(events: readonly LoopEvent[]) => void>();
  const unsubscribe = loop.subscribeEvents(heard);
  const stop = loop.start();

  vi.advanceTimersByTime(500);
  unsubscribe();
  heard.mockClear();
  vi.advanceTimersByTime(COUNTDOWN_MS);

  expect(heard).not.toHaveBeenCalled();

  stop();
});

test("a held loop passes no time and makes no sound, and resumes when released", () => {
  const loop = createRunLoop(1, () => STILL);
  const events = record(loop);
  loop.setHeld(true);
  const stop = loop.start();

  vi.advanceTimersByTime(10_000);
  expect(loop.getSnapshot().stage).toBe("countdown");
  expect(loop.getSnapshot().countdown).toBe(3);
  expect(events).toEqual([]);

  loop.setHeld(false);
  vi.advanceTimersByTime(COUNTDOWN_MS + 1000);
  expect(loop.getSnapshot().stage).toBe("running");

  stop();
});

test("holding a running Run freezes it, and no time is made up on release", () => {
  const loop = createRunLoop(1, () => STILL);
  const stop = loop.start();
  vi.advanceTimersByTime(COUNTDOWN_MS + 1000);

  loop.setHeld(true);
  const before = loop.getSnapshot().run.tick;
  vi.advanceTimersByTime(30_000);
  expect(loop.getSnapshot().run.tick).toBe(before);

  loop.setHeld(false);
  vi.advanceTimersByTime(1000);
  const gained = loop.getSnapshot().run.tick - before;
  expect(gained).toBeGreaterThan(TICKS_PER_SECOND - 5);
  expect(gained).toBeLessThanOrEqual(TICKS_PER_SECOND + 1);

  stop();
});

test("a hidden page stays paused while the loop is held, and the other way round", () => {
  const loop = createRunLoop(1, () => STILL);
  const stop = loop.start();
  vi.advanceTimersByTime(COUNTDOWN_MS + 1000);
  const before = loop.getSnapshot().run.tick;

  loop.setHeld(true);
  setHidden(true);
  setHidden(false);
  vi.advanceTimersByTime(5000);
  expect(loop.getSnapshot().run.tick).toBe(before);

  setHidden(true);
  loop.setHeld(false);
  vi.advanceTimersByTime(5000);
  expect(loop.getSnapshot().run.tick).toBe(before);

  setHidden(false);
  vi.advanceTimersByTime(1000);
  expect(loop.getSnapshot().run.tick).toBeGreaterThan(before);

  stop();
});
