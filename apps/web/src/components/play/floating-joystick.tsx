import type { MoveInput } from "@eddie-at-bangmod/game";
import { useState } from "react";
import type { PointerEvent } from "react";

/** How far, in CSS pixels, the knob travels for full speed. */
const REACH = 48;

/** Drags shorter than this share of the reach count as no input. */
const DEAD_ZONE = 0.15;

interface Stick {
  pointerId: number;
  origin: { x: number; y: number };
  knob: { x: number; y: number };
}

const toMove = (dx: number, dy: number): MoveInput => {
  const length = Math.hypot(dx, dy);

  if (length < REACH * DEAD_ZONE) {
    return { x: 0, y: 0 };
  }

  const scale = Math.min(length, REACH) / length / REACH;

  return { x: dx * scale, y: dy * scale };
};

const clampToReach = (dx: number, dy: number) => {
  const length = Math.hypot(dx, dy);
  const scale = length > REACH ? REACH / length : 1;

  return { x: dx * scale, y: dy * scale };
};

/** The pointer's position inside the element that listens for it. */
const local = (event: PointerEvent<HTMLDivElement>) => {
  const frame = event.currentTarget.getBoundingClientRect();

  return { x: event.clientX - frame.left, y: event.clientY - frame.top };
};

/**
 * A touch joystick that appears where the thumb goes down, anywhere in the
 * play frame, and follows the drag. Keyboard players use WASD or arrows.
 */
export const FloatingJoystick = ({
  onMove,
}: {
  onMove: (move: MoveInput | null) => void;
}) => {
  const [stick, setStick] = useState<Stick | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (stick) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const origin = local(event);
    setStick({ pointerId: event.pointerId, origin, knob: { x: 0, y: 0 } });
    onMove({ x: 0, y: 0 });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (stick?.pointerId !== event.pointerId) {
      return;
    }

    const point = local(event);
    const dx = point.x - stick.origin.x;
    const dy = point.y - stick.origin.y;
    setStick({ ...stick, knob: clampToReach(dx, dy) });
    onMove(toMove(dx, dy));
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (stick?.pointerId !== event.pointerId) {
      return;
    }

    setStick(null);
    onMove(null);
  };

  return (
    <div
      aria-hidden
      className="absolute inset-0 touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {stick && (
        <div
          className="pointer-events-none absolute size-24 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: stick.origin.x,
            top: stick.origin.y,
            border: "var(--plop-stroke) dashed var(--plop-ink)",
            borderRadius: "var(--plop-radius-blob)",
            background:
              "color-mix(in srgb, var(--plop-paper) 60%, transparent)",
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 size-12"
            style={{
              transform: `translate(calc(-50% + ${stick.knob.x}px), calc(-50% + ${stick.knob.y}px))`,
              border: "var(--plop-stroke) solid var(--plop-ink)",
              borderRadius: "var(--plop-radius-blob)",
              background: "var(--plop-mustard)",
            }}
          />
        </div>
      )}
    </div>
  );
};
