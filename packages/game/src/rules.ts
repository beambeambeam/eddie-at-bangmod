/** Simulation ticks per second. Run time counts ticks, never wall-clock time. */
export const TICKS_PER_SECOND = 60;

/** A Run lasts exactly 90 s of game time. */
export const RUN_TICKS = 90 * TICKS_PER_SECOND;

/** Eddie's walking speed in Market units per second at full input. */
export const EDDIE_SPEED = 3;

/** Points for one Item at Combo ×1. The Combo multiplies them. */
export const ITEM_POINTS = 100;

/** Points for each cleared Shopping List. The Combo does not touch them. */
export const SHOPPING_LIST_POINTS = 300;

/** The highest Combo. */
export const MAX_COMBO = 3;

/**
 * A pickup at most this many ticks (4 s) after the last one grows the Combo.
 * Once more ticks than this pass with no pickup, the Combo drops to ×1.
 */
export const COMBO_WINDOW_TICKS = 4 * TICKS_PER_SECOND;

/** Every Shopping List asks for this many distinct Items. */
export const SHOPPING_LIST_SIZE = 3;

/** Where Eddie stands when a Run starts: the middle of the Market. */
export const EDDIE_START = { x: 0, y: 0 } as const;
