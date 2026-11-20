import { describe, expect, test } from "vite-plus/test";

import { MARKET, createRun } from "./index";
import type { MoveInput, Run } from "./index";

const RIGHT = { x: 1, y: 0 };
const LEFT = { x: -1, y: 0 };
const UP = { x: 0, y: -1 };
const DOWN = { x: 0, y: 1 };
const STILL = { x: 0, y: 0 };

const stepMany = (run: Run, input: MoveInput, ticks: number) => {
  for (let tick = 0; tick < ticks; tick += 1) {
    run.step(input);
  }
};

describe("Eddie's movement", () => {
  test("Eddie starts in the middle of the Market", () => {
    const run = createRun({ seed: 1 });

    expect(run.snapshot().eddie.position).toEqual({ x: 0, y: 0 });
  });

  test("Eddie walks 0.06 units per tick at full input", () => {
    const run = createRun({ seed: 1 });

    run.step(RIGHT);

    expect(run.snapshot().eddie.position.x).toBeCloseTo(0.06);
    expect(run.snapshot().tick).toBe(1);
  });

  test("diagonal input is no faster than straight input", () => {
    const run = createRun({ seed: 1 });

    run.step({ x: 1, y: 1 });

    const { x, y } = run.snapshot().eddie.position;
    expect(Math.hypot(x, y)).toBeCloseTo(0.06);
  });

  test("a half-pushed joystick walks at half speed", () => {
    const run = createRun({ seed: 1 });

    run.step({ x: 0, y: -0.5 });

    expect(run.snapshot().eddie.position.y).toBeCloseTo(-0.03);
  });
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

    run.step(input);

    const { x, y } = run.snapshot().eddie.facing;
    expect(x).toBeCloseTo(facing.x);
    expect(y).toBeCloseTo(facing.y);
  });

  test("Eddie keeps his facing when he stops", () => {
    const run = createRun({ seed: 1 });

    run.step(LEFT);
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
    ...Array.from({ length: 50 }, () => RIGHT),
    ...Array.from({ length: 90 }, () => ({ x: 0.4, y: -0.9 })),
    ...Array.from({ length: 20 }, () => STILL),
    ...Array.from({ length: 120 }, () => ({ x: -0.7, y: 0.7 })),
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
    run.step(RIGHT);
    const before = run.snapshot();

    run.step(RIGHT);

    expect(before.eddie.position.x).toBeCloseTo(0.06);
    expect(run.snapshot()).not.toBe(before);
  });

  test("reading the snapshot twice without a step returns the same object", () => {
    const run = createRun({ seed: 1 });
    run.step(RIGHT);

    expect(run.snapshot()).toBe(run.snapshot());
  });
});
