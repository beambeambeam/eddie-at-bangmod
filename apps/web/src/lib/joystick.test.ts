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
  let stick = pressStick(null, FIRST, { x: 100, y: 100 });
  stick = dragStick(stick, FIRST, { x: 200, y: 100 });

  expect(stickMove(stick, REACH)).toEqual({ x: 1, y: 0 });
});

test("a second finger neither moves the joystick nor takes it over", () => {
  let stick = pressStick(null, FIRST, { x: 100, y: 100 });
  stick = dragStick(stick, FIRST, { x: 100, y: 200 });
  stick = pressStick(stick, SECOND, { x: 300, y: 300 });
  stick = dragStick(stick, SECOND, { x: 0, y: 300 });

  expect(stickMove(stick, REACH)).toEqual({ x: 0, y: 1 });
});

test("only the owning finger's lift lets go, and then the next finger owns the joystick", () => {
  let stick = pressStick(null, FIRST, { x: 100, y: 100 });
  stick = dragStick(stick, FIRST, { x: 100, y: 200 });

  const afterSecondLifts = releaseStick(stick, SECOND);
  expect(stickMove(afterSecondLifts, REACH)).toEqual({ x: 0, y: 1 });

  const afterFirstLifts = releaseStick(afterSecondLifts, FIRST);
  expect(stickMove(afterFirstLifts, REACH)).toBeNull();

  let next = pressStick(afterFirstLifts, SECOND, { x: 300, y: 300 });
  next = dragStick(next, SECOND, { x: 200, y: 300 });
  expect(stickMove(next, REACH)).toEqual({ x: -1, y: 0 });
});

test("the joystick reaches further on a tablet than on a phone", () => {
  // A sideways phone is about 360 px tall; a sideways iPad about 780 px.
  expect(stickReach(360)).toBe(48);
  expect(stickReach(600)).toBe(78);
  expect(stickReach(780)).toBe(96);
});
