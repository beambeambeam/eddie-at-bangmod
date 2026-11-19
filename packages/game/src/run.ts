import { MARKET } from "./market";
import type { Item, Rect } from "./market";
import { createRandom } from "./random";
import type { Random } from "./random";
import {
  COMBO_WINDOW_TICKS,
  EDDIE_SPEED,
  EDDIE_START,
  ITEM_POINTS,
  MAX_COMBO,
  RUN_TICKS,
  SHOPPING_LIST_POINTS,
  TICKS_PER_SECOND,
} from "./rules";
import { drawShoppingList } from "./shopping-list";
import type { Dish, ShoppingList } from "./shopping-list";

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

/** Something that happened during one tick. Drives sounds, haptics and bursts. */
export type RunEvent =
  | {
      readonly type: "item-grabbed";
      readonly item: Item;
      /** The Combo this Item scored at. */
      readonly combo: number;
      readonly points: number;
    }
  | {
      readonly type: "shopping-list-cleared";
      readonly dish: Dish;
      readonly points: number;
    }
  | { readonly type: "run-ended" };

export interface RunSnapshot {
  /** Ticks stepped since the Run was created. Stops at `RUN_TICKS`. */
  readonly tick: number;
  /** Ticks until the Run ends. */
  readonly ticksLeft: number;
  /** True once time is up. Later steps change nothing. */
  readonly finished: boolean;
  readonly eddie: {
    readonly position: Vec2;
    /** Unit vector of the last move Eddie tried, in the same axes as input. */
    readonly facing: Vec2;
  };
  /** The Shopping List Eddie works on now. */
  readonly shoppingList: ShoppingList;
  readonly score: number;
  /** The multiplier for the next Item, from 1 to `MAX_COMBO`. */
  readonly combo: number;
  readonly bestCombo: number;
  readonly itemsGrabbed: number;
  readonly shoppingListsCleared: number;
}

export interface Run {
  /**
   * Advances the Run by one tick (1/60 s) with the player's movement and
   * returns what happened in that tick. Does nothing once the Run is finished.
   */
  step: (input: MoveInput) => readonly RunEvent[];
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

const contains = (area: Rect, { x, y }: Vec2) =>
  x >= area.minX && x <= area.maxX && y >= area.minY && y <= area.maxY;

/** The unticked Item on the list whose Stall front Eddie stands in, if any. */
const itemWithin = (list: ShoppingList, position: Vec2): Item | undefined =>
  MARKET.stalls.find(
    ({ item, front }) =>
      contains(front, position) &&
      list.items.some((entry) => entry.item === item && !entry.ticked)
  )?.item;

interface RunState {
  snapshot: RunSnapshot;
  /** The tick of the last grab, which times the Combo. */
  lastGrabTick: number | null;
  /** Every chance roll in a Run draws from here, so a seed replays exactly. */
  readonly random: Random;
}

/** True while a grab at `tick` still grows the Combo. */
const inComboWindow = (state: RunState, tick: number) =>
  state.lastGrabTick !== null &&
  tick - state.lastGrabTick <= COMBO_WINDOW_TICKS;

interface Grab {
  snapshot: RunSnapshot;
  events: RunEvent[];
}

/** Grabs `item`, then clears the list and draws the next one if it is done. */
const grab = (state: RunState, snapshot: RunSnapshot, item: Item): Grab => {
  const combo = inComboWindow(state, snapshot.tick)
    ? Math.min(snapshot.combo + 1, MAX_COMBO)
    : 1;

  const points = ITEM_POINTS * combo;
  state.lastGrabTick = snapshot.tick;

  const items = snapshot.shoppingList.items.map((entry) =>
    entry.item === item ? { item, ticked: true } : entry
  );

  const grabbed: RunSnapshot = {
    ...snapshot,
    shoppingList: { ...snapshot.shoppingList, items },
    score: snapshot.score + points,
    combo,
    bestCombo: Math.max(snapshot.bestCombo, combo),
    itemsGrabbed: snapshot.itemsGrabbed + 1,
  };

  const events: RunEvent[] = [{ type: "item-grabbed", item, combo, points }];

  if (!items.every((entry) => entry.ticked)) {
    return { snapshot: grabbed, events };
  }

  events.push({
    type: "shopping-list-cleared",
    dish: snapshot.shoppingList.dish,
    points: SHOPPING_LIST_POINTS,
  });

  return {
    snapshot: {
      ...grabbed,
      shoppingList: drawShoppingList(state.random, item),
      score: grabbed.score + SHOPPING_LIST_POINTS,
      shoppingListsCleared: grabbed.shoppingListsCleared + 1,
    },
    events,
  };
};

const advance = (state: RunState, input: MoveInput): RunEvent[] => {
  const move = clampLength(input);
  const { tick, eddie, combo } = state.snapshot;
  const next = tick + 1;

  let snapshot: RunSnapshot = {
    ...state.snapshot,
    tick: next,
    ticksLeft: RUN_TICKS - next,
    eddie: {
      position: walk(eddie.position, move),
      facing: faceToward(move, eddie.facing),
    },
    combo: inComboWindow(state, next) ? combo : 1,
  };

  const events: RunEvent[] = [];

  const item = itemWithin(snapshot.shoppingList, snapshot.eddie.position);

  if (item) {
    const result = grab(state, snapshot, item);
    ({ snapshot } = result);
    events.push(...result.events);
  }

  if (next === RUN_TICKS) {
    snapshot = { ...snapshot, finished: true };
    events.push({ type: "run-ended" });
  }

  state.snapshot = snapshot;

  return events;
};

export const createRun = ({ seed }: RunOptions): Run => {
  const random = createRandom(seed);

  const state: RunState = {
    snapshot: {
      tick: 0,
      ticksLeft: RUN_TICKS,
      finished: false,
      eddie: { position: EDDIE_START, facing: { x: 0, y: 1 } },
      shoppingList: drawShoppingList(random),
      score: 0,
      combo: 1,
      bestCombo: 1,
      itemsGrabbed: 0,
      shoppingListsCleared: 0,
    },
    lastGrabTick: null,
    random,
  };

  return {
    step: (input) => (state.snapshot.finished ? [] : advance(state, input)),
    snapshot: () => state.snapshot,
  };
};
