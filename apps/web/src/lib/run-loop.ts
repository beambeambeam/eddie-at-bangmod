import { TICKS_PER_SECOND, createRun } from "@eddie-at-bangmod/game";
import type { MoveInput, RunSnapshot } from "@eddie-at-bangmod/game";

const TICK_MS = 1000 / TICKS_PER_SECOND;

/** The longest frame gap the loop catches up on. Longer gaps are dropped. */
const MAX_CATCH_UP_MS = 250;

/** The 3-2-1 countdown, counted on the same fixed step as the Run. */
const COUNTDOWN_TICKS = 3 * TICKS_PER_SECOND;

/** What the play screen shows: the countdown, the Run, or its results. */
export type RunStage = "countdown" | "running" | "finished";

export interface RunView {
  readonly stage: RunStage;
  /** Whole seconds left in the countdown: 3, 2, 1. 0 once the Run starts. */
  readonly countdown: number;
  readonly run: RunSnapshot;
}

/**
 * Plays one Run: a 3-2-1 countdown, then the Run on a fixed 60 Hz step from
 * animation frames, until time is up. While the page is hidden, no ticks
 * pass. Exposes a `RunView` as an external store for `useSyncExternalStore`.
 */
export interface RunLoop {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => RunView;
  /** Starts the countdown. Returns a function that stops the loop. */
  start: () => () => void;
}

export const createRunLoop = (
  seed: number,
  readInput: () => MoveInput
): RunLoop => {
  const run = createRun({ seed });
  const listeners = new Set<() => void>();
  let countdownLeft = COUNTDOWN_TICKS;

  const viewNow = (): RunView => {
    const snapshot = run.snapshot();

    if (countdownLeft > 0) {
      return {
        stage: "countdown",
        countdown: Math.ceil(countdownLeft / TICKS_PER_SECOND),
        run: snapshot,
      };
    }

    return {
      stage: snapshot.finished ? "finished" : "running",
      countdown: 0,
      run: snapshot,
    };
  };

  let view = viewNow();

  const tick = () => {
    if (countdownLeft > 0) {
      countdownLeft -= 1;
    } else {
      run.step(readInput());
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => view,
    start() {
      let frame = 0;
      let last = performance.now();
      let pending = 0;

      const onFrame = (now: number) => {
        pending += Math.min(now - last, MAX_CATCH_UP_MS);
        last = now;
        let stepped = false;

        while (pending >= TICK_MS && !run.snapshot().finished) {
          tick();
          pending -= TICK_MS;
          stepped = true;
        }

        if (stepped) {
          view = viewNow();

          for (const listener of listeners) {
            listener();
          }
        }

        if (!run.snapshot().finished) {
          frame = requestAnimationFrame(onFrame);
        }
      };

      const resume = () => {
        cancelAnimationFrame(frame);
        last = performance.now();
        pending = 0;
        frame = requestAnimationFrame(onFrame);
      };

      // A hidden page stops the clock. On return it restarts from now, so
      // the time away never turns into catch-up ticks.
      const onVisibilityChange = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
        } else if (!run.snapshot().finished) {
          resume();
        }
      };

      document.addEventListener("visibilitychange", onVisibilityChange);

      if (!document.hidden) {
        resume();
      }

      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        cancelAnimationFrame(frame);
      };
    },
  };
};
