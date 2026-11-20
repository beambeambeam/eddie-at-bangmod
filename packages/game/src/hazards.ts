import { AISLE_GRID, MARKET } from "./market";
import type { Vec2 } from "./market";
import type { Random } from "./random";
import {
  CROWD_RADIUS,
  CROWD_SPEED,
  EDDIE_HALF_SIZE,
  MOTORBIKE_FAST_SPEED,
  MOTORBIKE_GAP_TICKS,
  MOTORBIKE_RADIUS,
  MOTORBIKE_SPEED,
  SOI_DOG_CHASE_SPEED,
  SOI_DOG_CHASE_TICKS,
  SOI_DOG_RADIUS,
  SOI_DOG_WANDER_TICKS,
  SOI_DOG_WANDER_SPEED,
  TICKS_PER_SECOND,
} from "./rules";
import type { Phase } from "./run";

export type HazardKind = "crowd" | "motorbike" | "soi-dog";

interface HazardBody {
  /** Stays the same for one Hazard for the whole Run. */
  readonly id: string;
  readonly position: Vec2;
  /** Unit vector of the way it moves, or last moved. */
  readonly facing: Vec2;
  /** The radius of its round footprint on the Market floor. */
  readonly radius: number;
}

/** A Hazard in the Market this tick, as the scene draws it. */
export type Hazard =
  | (HazardBody & { readonly kind: "crowd" | "motorbike" })
  | (HazardBody & {
      readonly kind: "soi-dog";
      /** True while it runs at Eddie. Only a chasing Soi Dog bites. */
      readonly chasing: boolean;
    });

/** The Hazards that Stun Eddie when they reach him. Crowds only slow him. */
export type HitterKind = Exclude<HazardKind, "crowd">;

const { xs, ys } = AISLE_GRID;

const at = (column: number, row: number): Vec2 => ({
  x: xs[column] ?? 0,
  y: ys[row] ?? 0,
});

/** Crowds drift back and forth on fixed routes through the middle of the Market. */
const MIDDLE_COLUMN = Math.floor(xs.length / 2);
const MIDDLE_ROW = Math.floor(ys.length / 2);

const CROWD_ROUTES = [
  { from: at(MIDDLE_COLUMN, 0), to: at(MIDDLE_COLUMN, ys.length - 1) },
  { from: at(0, MIDDLE_ROW), to: at(xs.length - 1, MIDDLE_ROW) },
];

/** The Soi Dog trots in from the back corner when Phase 3 starts. */
const SOI_DOG_START = { column: 0, row: 0 };

/** Motorbikes start and finish this far outside the Market edge. */
const MOTORBIKE_ENTRY_GAP = 1;

interface Motorbike {
  /** Where it is on its lane, or null while it waits off the edge. */
  x: number | null;
  waitTicks: number;
}

interface SoiDog {
  position: Vec2;
  facing: Vec2;
  /** The aisle crossing it trots toward while it wanders. */
  column: number;
  row: number;
  chasing: boolean;
  /** Ticks left in this wander or this chase. */
  ticksLeft: number;
}

/** Hazard state that carries from tick to tick. Crowds need none. */
export interface Hazards {
  motorbikes: Motorbike[] | null;
  soiDog: SoiDog | null;
}

export const createHazards = (): Hazards => ({
  motorbikes: null,
  soiDog: null,
});

const distance = (a: Vec2, b: Vec2) => Math.hypot(b.x - a.x, b.y - a.y);

const direction = (from: Vec2, to: Vec2, current: Vec2): Vec2 => {
  const length = distance(from, to);

  return length === 0
    ? current
    : { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

/** Moves up to `speed` (units per second) for one tick toward `to`. */
const towards = (from: Vec2, to: Vec2, speed: number) => {
  const step = speed / TICKS_PER_SECOND;
  const gap = distance(from, to);

  if (gap <= step) {
    return { position: to, arrived: true };
  }

  return {
    position: {
      x: from.x + ((to.x - from.x) / gap) * step,
      y: from.y + ((to.y - from.y) / gap) * step,
    },
    arrived: false,
  };
};

/** A whole number of ticks from `range.min` up to, not including, `range.max`. */
const rollTicks = (random: Random, range: { min: number; max: number }) =>
  range.min + Math.floor(random() * (range.max - range.min));

/** True when the Hazard's footprint reaches Eddie, who stands at `eddie`. */
export const touches = (hazard: Hazard, eddie: Vec2) =>
  distance(hazard.position, eddie) < hazard.radius + EDDIE_HALF_SIZE;

/** Where each Crowd is at `tick`: a fixed back-and-forth on its route. */
const crowdsAt = (tick: number): Hazard[] =>
  CROWD_ROUTES.map(({ from, to }, index) => {
    const length = distance(from, to);
    const travelled = ((CROWD_SPEED * tick) / TICKS_PER_SECOND) % (2 * length);
    const outward = travelled <= length;
    const along = outward ? travelled : 2 * length - travelled;

    return {
      id: `crowd-${index}`,
      kind: "crowd",
      position: {
        x: from.x + ((to.x - from.x) * along) / length,
        y: from.y + ((to.y - from.y) * along) / length,
      },
      facing: outward ? direction(from, to, to) : direction(to, from, from),
      radius: CROWD_RADIUS,
    };
  });

/**
 * Moves each Motorbike along its lane. One that leaves the far edge waits a
 * seeded gap, then rides in again from the near edge.
 */
const rideMotorbikes = (
  motorbikes: Motorbike[],
  phase: Phase,
  random: Random
): Hazard[] => {
  const speed = phase >= 3 ? MOTORBIKE_FAST_SPEED : MOTORBIKE_SPEED;
  const { minX, maxX } = MARKET.bounds;
  const riding: Hazard[] = [];

  for (const [index, lane] of MARKET.motorbikeLanes.entries()) {
    const motorbike = motorbikes[index];

    if (!motorbike) {
      continue;
    }

    const left = minX - MOTORBIKE_ENTRY_GAP;
    const right = maxX + MOTORBIKE_ENTRY_GAP;

    if (motorbike.x === null) {
      motorbike.waitTicks -= 1;

      if (motorbike.waitTicks <= 0) {
        motorbike.x = lane.heading > 0 ? left : right;
      }
    } else {
      motorbike.x += (lane.heading * speed) / TICKS_PER_SECOND;

      if (motorbike.x > right || motorbike.x < left) {
        motorbike.x = null;
        motorbike.waitTicks = rollTicks(random, MOTORBIKE_GAP_TICKS);
      }
    }

    if (motorbike.x !== null) {
      riding.push({
        id: `motorbike-${index}`,
        kind: "motorbike",
        position: { x: motorbike.x, y: lane.y },
        facing: { x: lane.heading, y: 0 },
        radius: MOTORBIKE_RADIUS,
      });
    }
  }

  return riding;
};

/** The aisle crossings next to (`column`, `row`) in the grid. */
const neighbours = (column: number, row: number) =>
  [
    { column: column - 1, row },
    { column: column + 1, row },
    { column, row: row - 1 },
    { column, row: row + 1 },
  ].filter(
    (next) =>
      next.column >= 0 &&
      next.column < xs.length &&
      next.row >= 0 &&
      next.row < ys.length
  );

/** The index of the value in `values` closest to `target`. */
const nearestIndex = (values: readonly number[], target: number) => {
  let best = 0;

  for (const [index, value] of values.entries()) {
    if (Math.abs(value - target) < Math.abs((values[best] ?? 0) - target)) {
      best = index;
    }
  }

  return best;
};

/** The aisle crossing closest to `position`. */
const nearestCrossing = (position: Vec2) => ({
  column: nearestIndex(xs, position.x),
  row: nearestIndex(ys, position.y),
});

const startWandering = (dog: SoiDog, random: Random) => {
  dog.chasing = false;
  dog.ticksLeft = rollTicks(random, SOI_DOG_WANDER_TICKS);
  Object.assign(dog, nearestCrossing(dog.position));
};

/**
 * The Soi Dog trots from crossing to crossing on a seeded path, or runs
 * straight at Eddie while it chases.
 */
const moveSoiDog = (dog: SoiDog, eddie: Vec2, random: Random) => {
  const target = dog.chasing ? eddie : at(dog.column, dog.row);
  const speed = dog.chasing ? SOI_DOG_CHASE_SPEED : SOI_DOG_WANDER_SPEED;
  const step = towards(dog.position, target, speed);

  dog.facing = direction(dog.position, step.position, dog.facing);
  dog.position = step.position;

  if (!dog.chasing && step.arrived) {
    const choices = neighbours(dog.column, dog.row);
    const next = choices[Math.floor(random() * choices.length)];

    if (next) {
      dog.column = next.column;
      dog.row = next.row;
    }
  }
};

/**
 * Counts down the wander or the chase. A seeded wander ends in a chase, and
 * a chase gives up after `SOI_DOG_CHASE_TICKS`. Runs at the end of the tick,
 * so the snapshot shows what the Soi Dog does next.
 */
const turnSoiDog = (dog: SoiDog, random: Random) => {
  dog.ticksLeft -= 1;

  if (dog.ticksLeft > 0) {
    return;
  }

  if (dog.chasing) {
    startWandering(dog, random);
  } else {
    dog.chasing = true;
    dog.ticksLeft = SOI_DOG_CHASE_TICKS;
  }
};

const soiDogHazard = (dog: SoiDog): Hazard => ({
  id: "soi-dog",
  kind: "soi-dog",
  position: dog.position,
  facing: dog.facing,
  radius: SOI_DOG_RADIUS,
  chasing: dog.chasing,
});

export interface HazardTick {
  tick: number;
  phase: Phase;
  /** Where Eddie stands after his move this tick. */
  eddie: Vec2;
  /** False while Eddie is Stunned: nothing can hit him then. */
  canHit: boolean;
}

export interface HazardStep {
  hazards: Hazard[];
  /** The Hazard that hit Eddie this tick, or null. */
  hit: HitterKind | null;
}

/**
 * Moves every Hazard one tick. Returns where they all are and the Hazard that
 * hit Eddie, if any. Phase 2 brings in the Motorbikes, Phase 3 the Soi Dog and
 * faster Motorbikes. A bite ends the Soi Dog's chase. Every chance roll comes
 * from `random`, so a seed replays the same Hazards.
 */
export const moveHazards = (
  hazards: Hazards,
  { tick, phase, eddie, canHit }: HazardTick,
  random: Random
): HazardStep => {
  if (phase >= 2 && !hazards.motorbikes) {
    hazards.motorbikes = MARKET.motorbikeLanes.map(() => ({
      x: null,
      waitTicks: rollTicks(random, { min: 1, max: TICKS_PER_SECOND }),
    }));
  }

  if (phase >= 3 && !hazards.soiDog) {
    hazards.soiDog = {
      position: at(SOI_DOG_START.column, SOI_DOG_START.row),
      facing: { x: 1, y: 0 },
      ...SOI_DOG_START,
      chasing: false,
      ticksLeft: rollTicks(random, SOI_DOG_WANDER_TICKS),
    };
  }

  const moved = crowdsAt(tick);
  let hit: HitterKind | null = null;

  if (hazards.motorbikes) {
    const motorbikes = rideMotorbikes(hazards.motorbikes, phase, random);

    if (canHit && motorbikes.some((motorbike) => touches(motorbike, eddie))) {
      hit = "motorbike";
    }

    moved.push(...motorbikes);
  }

  const dog = hazards.soiDog;

  if (dog) {
    moveSoiDog(dog, eddie, random);

    if (canHit && !hit && dog.chasing && touches(soiDogHazard(dog), eddie)) {
      hit = "soi-dog";
      startWandering(dog, random);
    } else {
      turnSoiDog(dog, random);
    }

    moved.push(soiDogHazard(dog));
  }

  return { hazards: moved, hit };
};

/** The Hazards at the start of a Run, before the first tick. */
export const startingHazards = (): Hazard[] => crowdsAt(0);
