import { TICKS_PER_SECOND, createRun } from "@eddie-at-bangmod/game";
import type { MoveInput, RunEvent, RunSnapshot } from "@eddie-at-bangmod/game";

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
 * Something that happened on a tick, for sounds, haptics and bursts: every
 * event of the game, plus the countdown's own ticks and the start of the Run.
 */
export type LoopEvent =
  | RunEvent
  | { readonly type: "countdown-tick"; readonly count: number }
  | { readonly type: "run-started" };

/**
 * Plays one Run: a 3-2-1 countdown, then the Run on a fixed 60 Hz step from
 * animation frames, until time is up. While the page is hidden or the loop
 * is held, no ticks pass and none are made up later. Exposes a `RunView` as
 * an external store for `useSyncExternalStore`, and the events of each
 * frame's ticks to feedback listeners.
 */
export interface RunLoop {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => RunView;
  /** Calls `listener` with the events of each frame that had any, in tick order. */
  subscribeEvents: (
    listener: (events: readonly LoopEvent[]) => void
  ) => () => void;
  /** While held, no time passes: for the how-to Sheet. Works before `start`. */
  setHeld: (held: boolean) => void;
  /** Starts the countdown. Returns a function that stops the loop. */
  start: () => () => void;
}

export const createRunLoop = (
  seed: number,
  readInput: () => MoveInput
): RunLoop => {
  const run = createRun({ seed });
  const listeners = new Set<() => void>();
  const eventListeners = new Set<(events: readonly LoopEvent[]) => void>();
  let held = false;
  // Re-reads whether the clock may run. Set while the loop is started.
  let sync: (() => void) | undefined;
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

  /** Steps one tick and returns what happened in it. */
  const tick = (): readonly LoopEvent[] => {
    if (countdownLeft === 0) {
      return run.step(readInput());
    }

    const events: LoopEvent[] = [];

    if (countdownLeft % TICKS_PER_SECOND === 0) {
      events.push({
        type: "countdown-tick",
        count: countdownLeft / TICKS_PER_SECOND,
      });
    }

    countdownLeft -= 1;

    if (countdownLeft === 0) {
      events.push({ type: "run-started" });
    }

    return events;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => view,
    subscribeEvents(listener) {
      eventListeners.add(listener);

      return () => {
        eventListeners.delete(listener);
      };
    },
    setHeld(next) {
      if (held !== next) {
        held = next;
        sync?.();
      }
    },
    start() {
      let frame = 0;
      let last = performance.now();
      let pending = 0;

      const onFrame = (now: number) => {
        pending += Math.min(now - last, MAX_CATCH_UP_MS);
        last = now;
        let stepped = false;
        const events: LoopEvent[] = [];

        while (pending >= TICK_MS && !run.snapshot().finished) {
          events.push(...tick());
          pending -= TICK_MS;
          stepped = true;
        }

        if (stepped) {
          view = viewNow();

          for (const listener of listeners) {
            listener();
          }
        }

        if (events.length > 0) {
          for (const listener of eventListeners) {
            listener(events);
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

      // A hidden page or a held loop stops the clock. When both let go, it
      // restarts from now, so the time away never turns into catch-up ticks.
      const syncClock = () => {
        cancelAnimationFrame(frame);

        if (!document.hidden && !held && !run.snapshot().finished) {
          resume();
        }
      };

      sync = syncClock;
      document.addEventListener("visibilitychange", syncClock);
      syncClock();

      return () => {
        document.removeEventListener("visibilitychange", syncClock);
        cancelAnimationFrame(frame);
        sync = undefined;
      };
    },
  };
};
