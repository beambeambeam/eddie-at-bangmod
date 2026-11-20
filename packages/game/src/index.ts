export { createRun } from "./run";

export type {
  MoveInput,
  Phase,
  Run,
  RunEvent,
  RunOptions,
  RunSnapshot,
} from "./run";

export {
  COMBO_WINDOW_TICKS,
  EDDIE_SPEED,
  ITEM_POINTS,
  MAX_COMBO,
  PHASE_TICKS,
  RUN_TICKS,
  SHOPPING_LIST_POINTS,
  SHOPPING_LIST_SIZE,
  SOI_DOG_CHASE_TICKS,
  SAFE_TICKS,
  STUN_TICKS,
  TICKS_PER_SECOND,
} from "./rules";

export { maxScore } from "./score-cap";

export { ITEMS, MARKET } from "./market";

export type { Item, Rect, Stall, Vec2 } from "./market";

export type { Hazard, HazardKind } from "./hazards";

export { DISHES } from "./shopping-list";

export type { Dish, ShoppingList } from "./shopping-list";
