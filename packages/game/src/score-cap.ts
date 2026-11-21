import { MARKET } from "./market";
import type { Rect } from "./market";
import {
  EDDIE_START,
  ITEM_POINTS,
  MAX_COMBO,
  RUN_TICKS,
  SHOPPING_LIST_POINTS,
  SHOPPING_LIST_SIZE,
  SPRINT_SPEED,
  TICKS_PER_SECOND,
} from "./rules";

const STEP = SPRINT_SPEED / TICKS_PER_SECOND;

const gapBetween = (a: Rect, b: Rect) =>
  Math.hypot(
    Math.max(0, b.minX - a.maxX, a.minX - b.maxX),
    Math.max(0, b.minY - a.maxY, a.minY - b.maxY)
  );

/** A lower bound on the ticks Eddie needs to cover `distance`. */
const ticksFor = (distance: number) => Math.max(1, Math.floor(distance / STEP));

const fronts = MARKET.stalls.map((stall) => stall.front);

const point = {
  minX: EDDIE_START.x,
  minY: EDDIE_START.y,
  maxX: EDDIE_START.x,
  maxY: EDDIE_START.y,
};

/**
 * The highest Score one Run can reach. The server rejects anything above it.
 *
 * It assumes a perfect player: the first pickup as soon as Eddie can reach
 * the nearest Stall front, then one pickup every time he can cross the
 * shortest gap between two Stall fronts, in straight lines through Stalls,
 * at ×3 from the third Item on. Two pickups in a row always come from
 * different Stalls: Items on a list are distinct, and a new list never asks
 * for the Item that cleared the last one.
 *
 * Eddie Sprints the whole time, ignoring Stamina. Hazards can only slow or
 * stop him, so they are left out too.
 */
export const maxScore = () => {
  const firstTick = ticksFor(
    Math.min(...fronts.map((front) => gapBetween(point, front)))
  );

  const gapTicks = ticksFor(
    Math.min(
      ...fronts.flatMap((a, i) =>
        fronts.slice(i + 1).map((b) => gapBetween(a, b))
      )
    )
  );

  const items = 1 + Math.floor((RUN_TICKS - firstTick) / gapTicks);

  let score = Math.floor(items / SHOPPING_LIST_SIZE) * SHOPPING_LIST_POINTS;

  for (let index = 0; index < items; index += 1) {
    score += ITEM_POINTS * Math.min(index + 1, MAX_COMBO);
  }

  return score;
};
