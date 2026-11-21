import type { MoveInput } from "@eddie-at-bangmod/game";
import { useRef, useState } from "react";
import type { PointerEvent } from "react";

import {
  dragStick,
  pressStick,
  releaseStick,
  stickMove,
  stickReach,
} from "@/lib/joystick";
import type { Stick } from "@/lib/joystick";

/** The pointer's position inside the element that listens for it. */
const local = (event: PointerEvent<HTMLDivElement>) => {
  const frame = event.currentTarget.getBoundingClientRect();

  return { x: event.clientX - frame.left, y: event.clientY - frame.top };
};

/** The knob's offset: the drag, held inside the reach. */
const knobOffset = ({ drag, reach }: Stick) => {
  const length = Math.hypot(drag.x, drag.y);
  const scale = length > reach ? reach / length : 1;

  return { x: drag.x * scale, y: drag.y * scale };
};

/**
 * A touch joystick that appears where the thumb goes down, anywhere on the
 * play screen, and follows the drag. The first finger owns it until it lifts;
 * other fingers do nothing. It grows with the screen's short side, so tablets
 * get a bigger stick. Keyboard players use WASD or arrows.
 */
export const FloatingJoystick = ({
  onMove,
}: {
  onMove: (move: MoveInput | null) => void;
}) => {
  const [stick, setStick] = useState<Stick | null>(null);
  // Pointer events can arrive faster than React renders, so the latest
  // stick lives in a ref too: a second finger always sees the first one.
  const current = useRef<Stick | null>(null);

  const update = (next: Stick | null) => {
    if (next === current.current) {
      return;
    }

    current.current = next;
    setStick(next);
    onMove(stickMove(next));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (current.current) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    const { width, height } = event.currentTarget.getBoundingClientRect();
    const reach = stickReach(Math.min(width, height));

    update(pressStick(null, event.pointerId, local(event), reach));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (current.current) {
      update(dragStick(current.current, event.pointerId, local(event)));
    }
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    update(releaseStick(current.current, event.pointerId));
  };

  const knob = stick ? knobOffset(stick) : null;

  return (
    <div
      aria-hidden
      className="absolute inset-0 touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
    >
      {stick && knob && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: stick.origin.x,
            top: stick.origin.y,
            width: stick.reach * 2,
            height: stick.reach * 2,
            border: "var(--plop-stroke) dashed var(--plop-ink)",
            borderRadius: "var(--plop-radius-blob)",
            background:
              "color-mix(in srgb, var(--plop-paper) 60%, transparent)",
          }}
        >
          <div
            className="absolute top-1/2 left-1/2"
            style={{
              width: stick.reach,
              height: stick.reach,
              transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
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
