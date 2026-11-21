import type { MoveInput } from "@eddie-at-bangmod/game";

interface Point {
  x: number;
  y: number;
}

/** The floating joystick while a finger holds it. `null` when no finger does. */
export interface Stick {
  pointerId: number;
  /** Where the finger went down. */
  origin: Point;
  /** How far the finger has dragged from the origin. */
  drag: Point;
  /** How far the knob can travel, in CSS pixels. */
  reach: number;
  sprint: boolean;
}

/** Drags shorter than this share of the reach count as no input. */
const DEAD_ZONE = 0.15;
const SPRINT_START = 0.85;
const SPRINT_HOLD = 0.8;

/** A finger goes down. */
export const pressStick = (
  stick: Stick | null,
  pointerId: number,
  point: Point,
  reach: number
): Stick =>
  stick ?? {
    pointerId,
    origin: point,
    drag: { x: 0, y: 0 },
    reach,
    sprint: false,
  };

/** A finger moves. */
export const dragStick = (
  stick: Stick,
  pointerId: number,
  point: Point
): Stick => {
  if (stick.pointerId !== pointerId) {
    return stick;
  }

  const drag = { x: point.x - stick.origin.x, y: point.y - stick.origin.y };
  const deflection = Math.hypot(drag.x, drag.y) / stick.reach;

  const sprint = stick.sprint
    ? deflection >= SPRINT_HOLD
    : deflection > SPRINT_START;

  return { ...stick, drag, sprint };
};

/** A finger lifts or the browser cancels it. */
export const releaseStick = (
  stick: Stick | null,
  pointerId: number
): Stick | null => (stick?.pointerId === pointerId ? null : stick);

/** The stick's controls, with deflection preserved for walking. */
export const stickMove = (stick: Stick | null): MoveInput | null => {
  if (!stick) {
    return null;
  }

  const {
    drag: { x, y },
    reach,
    sprint,
  } = stick;

  const length = Math.hypot(x, y);

  if (length < reach * DEAD_ZONE) {
    return { move: { x: 0, y: 0 }, sprint: false };
  }

  const scale = Math.min(length, reach) / length / reach;

  return { move: { x: x * scale, y: y * scale }, sprint };
};

/** The reach on a phone, in CSS pixels: a comfortable thumb drag. */
const MIN_REACH = 48;

/** The reach on a big tablet: further, so the stick does not feel tiny. */
const MAX_REACH = 96;

/** Between the two, the reach grows with the play screen's short side. */
const REACH_PER_SIDE = 0.13;

/** How far, in CSS pixels, the knob travels for full speed on a play screen whose short side is this long. */
export const stickReach = (shortSide: number) =>
  Math.round(
    Math.min(MAX_REACH, Math.max(MIN_REACH, shortSide * REACH_PER_SIDE))
  );
