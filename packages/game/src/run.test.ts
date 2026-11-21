import { describe, expect, test } from "vite-plus/test";

import { MARKET, createRun } from "./index";
import type { MoveInput, Run, Vec2 } from "./index";

const RIGHT = { x: 1, y: 0 };
const LEFT = { x: -1, y: 0 };
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };
const STILL = { x: 0, y: 0 };

const pace = (run: Run, tick: number) =>
  run.step({ move: tick % 2 === 0 ? RIGHT : LEFT, sprint: true });

const stepMany = (run: Run, move: Vec2, ticks: number, sprint = false) => {
  for (let tick = 0; tick < ticks; tick += 1) {
    run.step({ move, sprint });
  }
};

describe("Eddie's movement", () => {
  test.each([RIGHT, { x: 1, y: 1 }, { x: 0.86, y: 0 }])(
    "Sprinting with %j moves Eddie 0.09 units per tick",
    (move) => {
      const run = createRun({ seed: 1 });

      run.step({ move, sprint: true });

      const { x, y } = run.snapshot().eddie.position;
      expect(Math.hypot(x, y)).toBeCloseTo(0.09);
    }
  );

  test("Eddie starts in the middle of the Market", () => {
    const run = createRun({ seed: 1 });

    expect(run.snapshot().eddie.position).toEqual({ x: 0, y: 0 });
  });

  test("Eddie walks 0.06 units per tick at full input", () => {
    const run = createRun({ seed: 1 });

    run.step({ move: RIGHT, sprint: false });

    expect(run.snapshot().eddie.position.x).toBeCloseTo(0.06);
    expect(run.snapshot().tick).toBe(1);
  });

  test("diagonal input is no faster than straight input", () => {
    const run = createRun({ seed: 1 });

    run.step({ move: { x: 1, y: 1 }, sprint: false });

    const { x, y } = run.snapshot().eddie.position;
    expect(Math.hypot(x, y)).toBeCloseTo(0.06);
  });

  test("a half-pushed joystick walks at half speed", () => {
    const run = createRun({ seed: 1 });

    run.step({ move: { x: 0, y: -0.5 }, sprint: false });

    expect(run.snapshot().eddie.position.y).toBeCloseTo(-0.03);
  });
});

describe("Stamina", () => {
  test("a Run starts full and 3 seconds of Sprint makes Eddie Winded once", () => {
    const run = createRun({ seed: 1 });
    expect(run.snapshot().eddie).toMatchObject({ stamina: 1, winded: false });

    for (let tick = 0; tick < 179; tick += 1) {
      expect(pace(run, tick)).not.toContainEqual({ type: "winded" });
    }

    expect(run.snapshot().eddie.stamina).toBeCloseTo(1 / 180);
    expect(pace(run, 179)).toEqual([{ type: "winded" }]);
    expect(run.snapshot().eddie).toMatchObject({ stamina: 0, winded: true });
    expect(pace(run, 180)).toEqual([]);
  });

  test("Eddie walks while Winded and can Sprint again above 30%", () => {
    const run = createRun({ seed: 1 });

    for (let tick = 0; tick < 180; tick += 1) {
      pace(run, tick);
    }

    const before = run.snapshot().eddie.position.x;
    pace(run, 180);
    expect(run.snapshot().eddie.position.x - before).toBeCloseTo(0.06);

    // Leave the middle aisle before a Crowd reaches it.
    stepMany(run, UP, 30);
    stepMany(run, STILL, 59, true);
    expect(run.snapshot().eddie).toMatchObject({ stamina: 0.3, winded: true });

    pace(run, 181);
    expect(run.snapshot().eddie.winded).toBe(false);
    expect(run.snapshot().eddie.position.x).toBeCloseTo(before);

    pace(run, 182);
    expect(run.snapshot().eddie.position.x - before).toBeCloseTo(0.09);
  });

  test.each([false, true])(
    "walking or holding still refills in 5 seconds (moving: %s)",
    (moving) => {
      const run = createRun({ seed: 1 });

      for (let tick = 0; tick < 180; tick += 1) {
        pace(run, tick);
      }

      for (let tick = 0; tick < 299; tick += 1) {
        const direction = tick % 2 === 0 ? RIGHT : LEFT;
        const move = moving ? direction : STILL;
        run.step({ move, sprint: !moving });
      }

      expect(run.snapshot().eddie.stamina).toBeCloseTo(299 / 300);
      run.step({ move: moving ? LEFT : STILL, sprint: !moving });
      expect(run.snapshot().eddie.stamina).toBe(1);
    }
  );
});

describe("Eddie's facing", () => {
  test("Eddie starts facing down the screen, toward the camera", () => {
    expect(createRun({ seed: 1 }).snapshot().eddie.facing).toEqual(DOWN);
  });

  test.each([
    { input: LEFT, facing: LEFT },
    { input: RIGHT, facing: RIGHT },
    { input: UP, facing: UP },
    { input: { x: 0.5, y: 0.5 }, facing: { x: Math.SQRT1_2, y: Math.SQRT1_2 } },
    { input: { x: 0, y: -0.3 }, facing: UP },
  ])("moving $input faces $facing", ({ input, facing }) => {
    const run = createRun({ seed: 1 });

    run.step({ move: input, sprint: false });

    const { x, y } = run.snapshot().eddie.facing;
    expect(x).toBeCloseTo(facing.x);
    expect(y).toBeCloseTo(facing.y);
  });

  test("Eddie keeps his facing when he stops", () => {
    const run = createRun({ seed: 1 });

    run.step({ move: LEFT, sprint: false });
    stepMany(run, STILL, 10);

    expect(run.snapshot().eddie.facing).toEqual(LEFT);
  });

  test("Eddie faces where he tries to walk, even into a Stall", () => {
    const run = createRun({ seed: 1 });

    stepMany(run, RIGHT, 40);
    stepMany(run, UP, 200);

    expect(run.snapshot().eddie.facing).toEqual(UP);
  });
});

describe("Market edges", () => {
  test.each([
    { input: RIGHT, axis: "x", stop: 8.2 },
    { input: LEFT, axis: "x", stop: -8.2 },
    { input: UP, axis: "y", stop: -4.7 },
    { input: DOWN, axis: "y", stop: 4.7 },
  ] as const)(
    "walking $input stops Eddie at $axis = $stop",
    ({ input, axis, stop }) => {
      const run = createRun({ seed: 1 });

      stepMany(run, input, 300);

      expect(run.snapshot().eddie.position[axis]).toBeCloseTo(stop);
    }
  );

  test("Eddie stops Sprinting at a Market edge and starts refilling", () => {
    const run = createRun({ seed: 1 });
    stepMany(run, RIGHT, 140, true);
    const { position, stamina } = run.snapshot().eddie;
    expect(position.x).toBeCloseTo(8.2);

    run.step({ move: RIGHT, sprint: true });
    expect(run.snapshot().eddie.position).toEqual(position);
    expect(run.snapshot().eddie.stamina).toBeGreaterThan(stamina);
  });
});

describe("Stalls", () => {
  test("the Market has 8 Stalls, one for each Item", () => {
    expect(MARKET.stalls.map((stall) => stall.item)).toEqual([
      "basil",
      "pork",
      "egg",
      "rice",
      "chili",
      "garlic",
      "fish-sauce",
      "lime",
    ]);
  });

  test("Eddie stops at the front of a Stall he walks into", () => {
    const run = createRun({ seed: 1 });

    stepMany(run, RIGHT, 40);
    stepMany(run, UP, 200);

    const { position } = run.snapshot().eddie;
    expect(position.y).toBeCloseTo(-1.3);
    expect(position.x).toBeCloseTo(2.4);
  });

  test("the front of a Stall also stops a Sprint", () => {
    const run = createRun({ seed: 1 });

    stepMany(run, RIGHT, 40);
    stepMany(run, UP, 20, true);

    expect(run.snapshot().eddie.position.y).toBeCloseTo(-1.3);
    expect(run.snapshot().eddie.stamina).toBeLessThan(1);
  });

  test("Eddie stops at the side of a Stall he walks into", () => {
    const run = createRun({ seed: 1 });

    stepMany(run, UP, 37);
    stepMany(run, RIGHT, 200);

    const { position } = run.snapshot().eddie;
    expect(position.x).toBeCloseTo(0.5);
    expect(position.y).toBeCloseTo(-2.22);
  });

  test("Eddie slides along a Stall when he walks into it at an angle", () => {
    const run = createRun({ seed: 1 });

    stepMany(run, RIGHT, 40);
    stepMany(run, UP, 200);
    stepMany(run, { x: 1, y: -1 }, 15);

    const { position } = run.snapshot().eddie;
    expect(position.y).toBeCloseTo(-1.3);
    expect(position.x).toBeGreaterThan(2.9);
  });
});

describe("Run determinism", () => {
  const script: MoveInput[] = [
    ...Array.from({ length: 50 }, () => ({ move: RIGHT, sprint: true })),
    ...Array.from({ length: 90 }, () => ({
      move: { x: 0.4, y: -0.9 },
      sprint: true,
    })),
    ...Array.from({ length: 20 }, () => ({ move: STILL, sprint: false })),
    ...Array.from({ length: 120 }, () => ({
      move: { x: -0.7, y: 0.7 },
      sprint: false,
    })),
  ];

  const play = (seed: number) => {
    const run = createRun({ seed });

    for (const input of script) {
      run.step(input);
    }

    return run.snapshot();
  };

  test("the same seed and inputs give the same snapshot", () => {
    expect(play(42)).toEqual(play(42));
  });

  test("a snapshot does not change when the Run steps again", () => {
    const run = createRun({ seed: 1 });
    run.step({ move: RIGHT, sprint: false });
    const before = run.snapshot();

    run.step({ move: RIGHT, sprint: false });

    expect(before.eddie.position.x).toBeCloseTo(0.06);
    expect(run.snapshot()).not.toBe(before);
  });

  test("reading the snapshot twice without a step returns the same object", () => {
    const run = createRun({ seed: 1 });
    run.step({ move: RIGHT, sprint: false });

    expect(run.snapshot()).toBe(run.snapshot());
  });
});
