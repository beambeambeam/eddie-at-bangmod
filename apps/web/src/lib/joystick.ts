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
}

/** Drags shorter than this share of the reach count as no input. */
const DEAD_ZONE = 0.15;

/** A finger goes down. */
export const pressStick = (
  stick: Stick | null,
  pointerId: number,
  point: Point
): Stick => stick ?? { pointerId, origin: point, drag: { x: 0, y: 0 } };

/** A finger moves. */
export const dragStick = (
  stick: Stick,
  pointerId: number,
  point: Point
): Stick =>
  stick.pointerId === pointerId
    ? {
        ...stick,
        drag: { x: point.x - stick.origin.x, y: point.y - stick.origin.y },
      }
    : stick;

/** A finger lifts or the browser cancels it. */
export const releaseStick = (
  stick: Stick | null,
  pointerId: number
): Stick | null => (stick?.pointerId === pointerId ? null : stick);

/** The movement the stick asks for: full speed at `reach` CSS pixels. */
export const stickMove = (
  stick: Stick | null,
  reach: number
): MoveInput | null => {
  if (!stick) {
    return null;
  }

  const { x, y } = stick.drag;
  const length = Math.hypot(x, y);

  if (length < reach * DEAD_ZONE) {
    return { x: 0, y: 0 };
  }

  const scale = Math.min(length, reach) / length / reach;

  return { x: x * scale, y: y * scale };
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
