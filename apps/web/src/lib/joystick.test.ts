import { expect, test } from "vite-plus/test";

import {
  dragStick,
  pressStick,
  releaseStick,
  stickMove,
  stickReach,
} from "./joystick";

const REACH = 50;
const FIRST = 1;
const SECOND = 2;

test("the first finger owns the joystick and steers at full speed past its reach", () => {
  let stick = pressStick(null, FIRST, { x: 100, y: 100 }, REACH);
  stick = dragStick(stick, FIRST, { x: 200, y: 100 });

  expect(stickMove(stick)).toEqual({ move: { x: 1, y: 0 }, sprint: true });
});

test("a second finger neither moves the joystick nor takes it over", () => {
  let stick = pressStick(null, FIRST, { x: 100, y: 100 }, REACH);
  stick = dragStick(stick, FIRST, { x: 100, y: 200 });
  stick = pressStick(stick, SECOND, { x: 300, y: 300 }, REACH);
  stick = dragStick(stick, SECOND, { x: 0, y: 300 });

  expect(stickMove(stick)).toEqual({ move: { x: 0, y: 1 }, sprint: true });
});

test("only the owning finger's lift lets go, and then the next finger owns the joystick", () => {
  let stick = pressStick(null, FIRST, { x: 100, y: 100 }, REACH);
  stick = dragStick(stick, FIRST, { x: 100, y: 200 });

  const afterSecondLifts = releaseStick(stick, SECOND);
  expect(stickMove(afterSecondLifts)).toEqual({
    move: { x: 0, y: 1 },
    sprint: true,
  });

  const afterFirstLifts = releaseStick(afterSecondLifts, FIRST);
  expect(stickMove(afterFirstLifts)).toBeNull();

  let next = pressStick(afterFirstLifts, SECOND, { x: 300, y: 300 }, REACH);
  next = dragStick(next, SECOND, { x: 200, y: 300 });
  expect(stickMove(next)).toEqual({ move: { x: -1, y: 0 }, sprint: true });
});

test("the joystick reaches further on a tablet than on a phone", () => {
  // A sideways phone is about 360 px tall; a sideways iPad about 780 px.
  expect(stickReach(360)).toBe(48);
  expect(stickReach(600)).toBe(78);
  expect(stickReach(780)).toBe(96);
});

test("the joystick starts a Sprint above 85% and holds it down to 80%", () => {
  let stick = pressStick(null, FIRST, { x: 0, y: 0 }, 100);

  stick = dragStick(stick, FIRST, { x: 50, y: 0 });
  expect(stickMove(stick)).toEqual({ move: { x: 0.5, y: 0 }, sprint: false });

  for (const [x, sprint] of [
    [85, false],
    [86, true],
    [80, true],
    [79, false],
    [82, false],
    [86, true],
  ] as const) {
    stick = dragStick(stick, FIRST, { x, y: 0 });
    expect(stickMove(stick)?.sprint).toBe(sprint);
  }

  stick = pressStick(releaseStick(stick, FIRST), FIRST, { x: 0, y: 0 }, 100);
  stick = dragStick(stick, FIRST, { x: 82, y: 0 });
  expect(stickMove(stick)?.sprint).toBe(false);
});
