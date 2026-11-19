import { TICKS_PER_SECOND, createRun } from "@eddie-at-bangmod/game";
import type { MoveInput, RunSnapshot } from "@eddie-at-bangmod/game";

const TICK_MS = 1000 / TICKS_PER_SECOND;

/** The longest frame gap the loop catches up on. Longer gaps are dropped. */
const MAX_CATCH_UP_MS = 250;

/**
 * Runs a Run on a fixed 60 Hz step from animation frames, and exposes its
 * snapshot as an external store for `useSyncExternalStore`.
 */
export interface RunLoop {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => RunSnapshot;
  /** Starts stepping on animation frames. Returns a function that stops it. */
  start: () => () => void;
}

export const createRunLoop = (
  seed: number,
  readInput: () => MoveInput
): RunLoop => {
  const run = createRun({ seed });
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => run.snapshot(),
    start() {
      let frame = 0;
      let last = performance.now();
      let pending = 0;

      const onFrame = (now: number) => {
        pending += Math.min(now - last, MAX_CATCH_UP_MS);
        last = now;
        let stepped = false;

        while (pending >= TICK_MS) {
          run.step(readInput());
          pending -= TICK_MS;
          stepped = true;
        }

        if (stepped) {
          for (const listener of listeners) {
            listener();
          }
        }

        frame = requestAnimationFrame(onFrame);
      };

      frame = requestAnimationFrame(onFrame);

      return () => {
        cancelAnimationFrame(frame);
      };
    },
  };
};
