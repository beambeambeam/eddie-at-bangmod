import { describe, expect, test } from "vite-plus/test";

import {
  EDDIE_SPEED,
  MARKET,
  PHASE_TICKS,
  RUN_TICKS,
  SAFE_TICKS,
  SOI_DOG_CHASE_TICKS,
  STUN_TICKS,
  TICKS_PER_SECOND,
  createRun,
} from "./index";
import type {
  Hazard,
  HazardKind,
  MoveInput,
  Run,
  RunEvent,
  Vec2,
} from "./index";

const STILL = { x: 0, y: 0 };
const STEP = EDDIE_SPEED / TICKS_PER_SECOND;

/** Walks along one axis at full speed and lands exactly on `goal`. */
const walkTo = (run: Run, axis: keyof Vec2, goal: number) => {
  const events: RunEvent[] = [];
  const gap = () => goal - run.snapshot().eddie.position[axis];

  while (!run.snapshot().finished && Math.abs(gap()) > 1e-9) {
    const push = Math.max(-1, Math.min(1, gap() / STEP));
    events.push(
      ...run.step(axis === "x" ? { x: push, y: 0 } : { x: 0, y: push })
    );
  }

  return events;
};

const stepMany = (run: Run, input: MoveInput, ticks: number) =>
  Array.from({ length: ticks }, () => run.step(input)).flat();

describe("Phases", () => {
  test("Phases change at 30 s and 60 s of game time", () => {
    const run = createRun({ seed: 1 });
    expect(run.snapshot().phase).toBe(1);

    const first = stepMany(run, STILL, 1799);
    expect(run.snapshot().phase).toBe(1);
    expect(run.step(STILL)).toContainEqual({ type: "phase-changed", phase: 2 });
    expect(run.snapshot().phase).toBe(2);

    const second = stepMany(run, STILL, 1799);
    expect(run.snapshot().phase).toBe(2);
    expect(run.step(STILL)).toContainEqual({ type: "phase-changed", phase: 3 });
    expect(run.snapshot().phase).toBe(3);

    const rest = stepMany(run, STILL, 1800);
    expect(run.snapshot().phase).toBe(3);

    expect(
      [...first, ...second, ...rest].filter(
        (event) => event.type === "phase-changed"
      )
    ).toEqual([]);
  });
});

/** Every kind of Hazard seen in the Market from now over `ticks` ticks. */
const kindsSeen = (run: Run, ticks: number) => {
  const kinds = new Set<HazardKind>();

  for (let tick = 0; tick < ticks; tick += 1) {
    for (const hazard of run.snapshot().hazards) {
      kinds.add(hazard.kind);
    }

    run.step(STILL);
  }

  return kinds;
};

describe("Hazards on the Phase schedule", () => {
  test("Phase 1 has Crowds only, Phase 2 adds Motorbikes, Phase 3 adds the Soi Dog", () => {
    const run = createRun({ seed: 1 });

    expect(kindsSeen(run, PHASE_TICKS)).toEqual(new Set(["crowd"]));
    expect(kindsSeen(run, PHASE_TICKS)).toEqual(
      new Set(["crowd", "motorbike"])
    );
    expect(kindsSeen(run, PHASE_TICKS)).toEqual(
      new Set(["crowd", "motorbike", "soi-dog"])
    );
  });

  test("Motorbikes ride faster in Phase 3 than in Phase 2", () => {
    /** The fastest a Motorbike moves in one tick over the next `ticks`. */
    const topSpeed = (run: Run, ticks: number) => {
      let fastest = 0;

      for (let tick = 0; tick < ticks; tick += 1) {
        const before = run.snapshot().hazards;
        run.step(STILL);

        for (const hazard of run.snapshot().hazards) {
          const last = before.find(({ id }) => id === hazard.id);

          if (hazard.kind === "motorbike" && last) {
            fastest = Math.max(
              fastest,
              Math.abs(hazard.position.x - last.position.x)
            );
          }
        }
      }

      return fastest;
    };

    const run = createRun({ seed: 3 });
    stepMany(run, STILL, PHASE_TICKS);

    const phase2 = topSpeed(run, PHASE_TICKS - 1);
    // This tick enters Phase 3, so it counts for neither.
    run.step(STILL);
    const phase3 = topSpeed(run, PHASE_TICKS);

    expect(phase2).toBeGreaterThan(0);
    expect(phase3).toBeGreaterThan(phase2);
  });

  test("Motorbikes ride only on the fixed lanes, in the lane's heading", () => {
    const run = createRun({ seed: 2 });
    stepMany(run, STILL, PHASE_TICKS);

    for (let tick = 0; tick < 2 * PHASE_TICKS; tick += 1) {
      run.step(STILL);

      for (const hazard of run.snapshot().hazards) {
        if (hazard.kind === "motorbike") {
          const lane = MARKET.motorbikeLanes.find(
            ({ y }) => y === hazard.position.y
          );

          expect(lane).toBeDefined();
          expect(hazard.facing).toEqual({ x: lane?.heading, y: 0 });
        }
      }
    }
  });
});

describe("Crowds", () => {
  test("a Crowd slows Eddie to half speed but never stops or Stuns him", () => {
    const run = createRun({ seed: 1 });
    const steps: number[] = [];
    const events: RunEvent[] = [];

    // Eddie paces left and right in the middle aisle, where both Crowds pass.
    for (let tick = 0; tick < 10 * TICKS_PER_SECOND; tick += 1) {
      const from = run.snapshot().eddie.position;
      const push = Math.floor(tick / 10) % 2 === 0 ? 1 : -1;
      events.push(...run.step({ x: push, y: 0 }));
      const to = run.snapshot().eddie.position;
      steps.push(Math.hypot(to.x - from.x, to.y - from.y));
      expect(run.snapshot().eddie.stunTicksLeft).toBe(0);
    }

    const full = steps.filter((step) => Math.abs(step - STEP) < 1e-9);
    const slowed = steps.filter((step) => Math.abs(step - STEP / 2) < 1e-9);

    expect(full.length).toBeGreaterThan(0);
    expect(slowed.length).toBeGreaterThan(0);
    expect(full.length + slowed.length).toBe(steps.length);
    expect(events).toEqual([]);
  });
});

/** The front lane runs right under the front of the Chili and Garlic Stalls. */
const LANE_Y = 4.2;
const STALL_FRONT_Y = 2.8;

/** The aisle between the Chili and Garlic Stalls. */
const AISLE_X = -4;

/**
 * Seed 2 starts on Nam Jim (Chili, Garlic, Lime). Eddie waits between the
 * Chili and Garlic Stalls through Phase 1, grabs Chili and Garlic just after
 * Phase 2 starts, then stands on the front lane until the first Motorbike
 * hits him, inside the Combo window.
 */
const hitAfterTwoGrabs = () => {
  const run = createRun({ seed: 2 });
  expect(run.snapshot().shoppingList.dish).toBe("nam-jim");

  walkTo(run, "x", AISLE_X);
  walkTo(run, "y", STALL_FRONT_Y);
  stepMany(run, STILL, PHASE_TICKS + 20 - run.snapshot().tick);
  walkTo(run, "x", -4.8);
  walkTo(run, "x", -3.2);
  walkTo(run, "y", LANE_Y);

  let comboBefore = run.snapshot().combo;
  let events: readonly RunEvent[] = [];

  while (!run.snapshot().finished && events.length === 0) {
    comboBefore = run.snapshot().combo;
    events = run.step(STILL);
  }

  expect(events).toEqual([{ type: "eddie-hit", hazard: "motorbike" }]);

  return { run, comboBefore };
};

describe("Motorbike hits", () => {
  test("a Motorbike hit Stuns Eddie for 1.5 s: he cannot move, then walks again", () => {
    const { run } = hitAfterTwoGrabs();
    expect(STUN_TICKS).toBe(90);
    expect(run.snapshot().eddie.stunTicksLeft).toBe(STUN_TICKS);
    const hitAt = run.snapshot().eddie.position;

    const stunned = stepMany(run, { x: 0, y: -1 }, STUN_TICKS);
    expect(run.snapshot().eddie.position).toEqual(hitAt);
    expect(run.snapshot().eddie.stunTicksLeft).toBe(0);
    expect(stunned.filter((e) => e.type === "eddie-hit")).toEqual([]);

    run.step({ x: 0, y: -1 });
    expect(run.snapshot().eddie.position.y).toBeLessThan(hitAt.y);
  });

  test("after a Stun, nothing hits Eddie for 0.5 s, even when he stays in the way", () => {
    expect(SAFE_TICKS).toBe(30);

    for (let seed = 1; seed <= 40; seed += 1) {
      const run = createRun({ seed });
      walkTo(run, "x", AISLE_X);
      walkTo(run, "y", LANE_Y);
      let lastHit: number | null = null;

      while (!run.snapshot().finished) {
        const events = run.step(STILL);

        if (events.some((event) => event.type === "eddie-hit")) {
          const { tick } = run.snapshot();

          if (lastHit !== null) {
            expect(tick - lastHit).toBeGreaterThan(STUN_TICKS + SAFE_TICKS);
          }

          lastHit = tick;
        }
      }

      expect(run.snapshot().tick).toBe(RUN_TICKS);
    }
  });

  test("a hit resets the Combo to ×1 but keeps every ticked Item", () => {
    const { run, comboBefore } = hitAfterTwoGrabs();

    expect(comboBefore).toBe(2);
    expect(run.snapshot().combo).toBe(1);
    expect(run.snapshot().itemsGrabbed).toBe(2);
    expect(run.snapshot().score).toBe(300);
    expect(
      run
        .snapshot()
        .shoppingList.items.filter(({ ticked }) => ticked)
        .map(({ item }) => item)
    ).toEqual(["chili", "garlic"]);
  });
});

const soiDog = (run: Run) =>
  run
    .snapshot()
    .hazards.find(
      (hazard): hazard is Extract<Hazard, { kind: "soi-dog" }> =>
        hazard.kind === "soi-dog"
    );

const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

describe("The Soi Dog", () => {
  test("it chases Eddie for at most 2 s, then gives up and wanders again", () => {
    const run = createRun({ seed: 4 });
    stepMany(run, STILL, 2 * PHASE_TICKS);
    const streaks: number[] = [];
    let givenUp = 0;
    let streak = 0;

    while (!run.snapshot().finished) {
      const before = soiDog(run);
      const eddie = run.snapshot().eddie.position;

      // Eddie runs straight away from a chasing Soi Dog and waits otherwise.
      const away =
        before?.chasing === true
          ? { x: eddie.x - before.position.x, y: eddie.y - before.position.y }
          : STILL;

      const events = run.step(away);
      const after = soiDog(run);

      if (before?.chasing === true && after?.chasing === true) {
        expect(distance(after.position, eddie)).toBeLessThan(
          distance(before.position, eddie)
        );
      }

      if (after?.chasing === true) {
        streak += 1;
      } else if (streak > 0) {
        streaks.push(streak);
        streak = 0;

        if (!events.some((e) => e.type === "eddie-hit")) {
          givenUp += 1;
        }
      }
    }

    expect(SOI_DOG_CHASE_TICKS).toBe(2 * TICKS_PER_SECOND);
    expect(givenUp).toBeGreaterThan(0);

    for (const length of streaks) {
      expect(length).toBeLessThanOrEqual(SOI_DOG_CHASE_TICKS);
    }
  });

  test("it bites only while it chases, and a bite ends the chase", () => {
    let bites = 0;

    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const run = createRun({ seed });
      stepMany(run, STILL, 2 * PHASE_TICKS);

      while (!run.snapshot().finished) {
        const chasing = soiDog(run)?.chasing;
        const events = run.step(STILL);

        if (
          events.some((e) => e.type === "eddie-hit" && e.hazard === "soi-dog")
        ) {
          bites += 1;
          expect(chasing).toBe(true);
          expect(soiDog(run)?.chasing).toBe(false);
          expect(run.snapshot().eddie.stunTicksLeft).toBe(STUN_TICKS);
        }
      }
    }

    expect(bites).toBeGreaterThan(0);
  });
});
