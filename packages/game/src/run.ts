import { MARKET } from "./market";
import type { Rect } from "./market";
import { createRandom } from "./random";
import type { Random } from "./random";

/** Simulation ticks per second. Run time counts ticks, never wall-clock time. */
export const TICKS_PER_SECOND = 60;

/** Eddie's walking speed in Market units per second at full input. */
export const EDDIE_SPEED = 3;

/** Half the side of Eddie's square footprint on the Market floor. */
const EDDIE_HALF_SIZE = 0.3;

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * The player's movement for one tick. `x` points right, `y` points down the
 * screen (toward the camera). Longer than 1 is scaled down to length 1.
 */
export type MoveInput = Vec2;

export interface RunSnapshot {
  /** Ticks stepped since the Run was created. */
  readonly tick: number;
  readonly eddie: {
    readonly position: Vec2;
    /** Unit vector of the last move Eddie tried, in the same axes as input. */
    readonly facing: Vec2;
  };
}

export interface Run {
  /** Advances the Run by one tick (1/60 s) with the player's movement. */
  step: (input: MoveInput) => void;
  /** The Run state after the last step. The object is replaced, never mutated. */
  snapshot: () => RunSnapshot;
}

export interface RunOptions {
  /** Seeds the Run's random generator. Same seed + same inputs = same Run. */
  seed: number;
}

const clampLength = ({ x, y }: Vec2): Vec2 => {
  const length = Math.hypot(x, y);

  return length > 1 ? { x: x / length, y: y / length } : { x, y };
};

/** Eddie turns to the way he tries to walk and keeps it when he stops. */
const faceToward = (move: Vec2, current: Vec2): Vec2 => {
  const length = Math.hypot(move.x, move.y);

  return length === 0 ? current : { x: move.x / length, y: move.y / length };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const overlaps = (a: Rect, b: Rect) =>
  a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;

const footprint = ({ x, y }: Vec2): Rect => ({
  minX: x - EDDIE_HALF_SIZE,
  minY: y - EDDIE_HALF_SIZE,
  maxX: x + EDDIE_HALF_SIZE,
  maxY: y + EDDIE_HALF_SIZE,
});

/** Moves along one axis, then pushes Eddie back out of any Stall he entered. */
const walkAxis = (from: Vec2, axis: "x" | "y", delta: number): Vec2 => {
  if (delta === 0) {
    return from;
  }

  const min = axis === "x" ? MARKET.bounds.minX : MARKET.bounds.minY;
  const max = axis === "x" ? MARKET.bounds.maxX : MARKET.bounds.maxY;

  let value = clamp(
    from[axis] + delta,
    min + EDDIE_HALF_SIZE,
    max - EDDIE_HALF_SIZE
  );

  for (const { area } of MARKET.stalls) {
    if (overlaps(footprint({ ...from, [axis]: value }), area)) {
      const near = axis === "x" ? area.minX : area.minY;
      const far = axis === "x" ? area.maxX : area.maxY;
      value = delta > 0 ? near - EDDIE_HALF_SIZE : far + EDDIE_HALF_SIZE;
    }
  }

  return { ...from, [axis]: value };
};

/** Walks one tick. Axes resolve one at a time, so Eddie slides along Stalls. */
const walk = (from: Vec2, move: Vec2): Vec2 => {
  const step = EDDIE_SPEED / TICKS_PER_SECOND;

  return walkAxis(walkAxis(from, "x", move.x * step), "y", move.y * step);
};

interface RunState {
  snapshot: RunSnapshot;
  /** Every chance roll in a Run draws from here, so a seed replays exactly. */
  readonly random: Random;
}

export const createRun = ({ seed }: RunOptions): Run => {
  const state: RunState = {
    snapshot: {
      tick: 0,
      eddie: { position: { x: 0, y: 0 }, facing: { x: 0, y: 1 } },
    },
    random: createRandom(seed),
  };

  return {
    step(input) {
      const move = clampLength(input);
      const { tick, eddie } = state.snapshot;
      state.snapshot = {
        tick: tick + 1,
        eddie: {
          position: walk(eddie.position, move),
          facing: faceToward(move, eddie.facing),
        },
      };
    },
    snapshot: () => state.snapshot,
  };
};
