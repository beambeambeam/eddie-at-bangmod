/** Simulation ticks per second. Run time counts ticks, never wall-clock time. */
export const TICKS_PER_SECOND = 60;

/** A Run lasts exactly 90 s of game time. */
export const RUN_TICKS = 90 * TICKS_PER_SECOND;

/** Eddie's walking speed in Market units per second at full input. */
export const EDDIE_SPEED = 3.6;

/** Eddie's Sprint speed in Market units per second. */
export const SPRINT_SPEED = EDDIE_SPEED * 1.5;

export const STAMINA_DRAIN_TICKS = 3 * TICKS_PER_SECOND;
export const STAMINA_REFILL_TICKS = 5 * TICKS_PER_SECOND;
export const WINDED_UNLOCK = 0.3;

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

/** A Run has three Phases of 30 s each. Each one adds or speeds up Hazards. */
export const PHASE_TICKS = 30 * TICKS_PER_SECOND;

/** How long the Motorbikes wait off the Market edge before the next crossing. */
export const MOTORBIKE_GAP_TICKS = {
  min: 1 * TICKS_PER_SECOND,
  max: 3 * TICKS_PER_SECOND,
};

/** Motorbike speed in Market units per second in Phase 2, then in Phase 3. */
export const MOTORBIKE_SPEED = 4.5;
export const MOTORBIKE_FAST_SPEED = 7;

/** Crowds drift along their aisles at this speed, in Market units per second. */
export const CROWD_SPEED = 0.9;

/** The Soi Dog trots between aisle crossings at this speed while it wanders. */
export const SOI_DOG_WANDER_SPEED = 1.5;

/** How long the Soi Dog wanders before its next chase. */
export const SOI_DOG_WANDER_TICKS = {
  min: 3 * TICKS_PER_SECOND,
  max: 6 * TICKS_PER_SECOND,
};

/**
 * The Soi Dog runs at Eddie a little faster than he walks, but gives up after
 * 2 s, so a quick player can stay ahead of it.
 */
export const SOI_DOG_CHASE_SPEED = 3.3;
export const SOI_DOG_CHASE_TICKS = 2 * TICKS_PER_SECOND;

/** Hazard sizes: the radius of each round footprint, in Market units. */
export const CROWD_RADIUS = 0.6;
export const MOTORBIKE_RADIUS = 0.4;
export const SOI_DOG_RADIUS = 0.3;

/** Eddie walks at this share of his speed while he overlaps a Crowd. */
export const CROWD_SLOWDOWN = 0.5;

/** Half the side of Eddie's square footprint on the Market floor. */
export const EDDIE_HALF_SIZE = 0.3;

/** A Motorbike or Soi Dog hit Stuns Eddie for 1.5 s: he cannot move. */
export const STUN_TICKS = 1.5 * TICKS_PER_SECOND;

/**
 * After a Stun, nothing can hit Eddie for 0.5 s while he walks away, so a
 * Hazard waiting on him cannot Stun him again the moment he is free.
 */
export const SAFE_TICKS = 0.5 * TICKS_PER_SECOND;
