import { describe, expect, test, vi } from "vite-plus/test";

import {
  DISHES,
  EDDIE_SPEED,
  ITEMS,
  MARKET,
  RUN_TICKS,
  TICKS_PER_SECOND,
  createRun,
  maxScore,
} from "./index";
import type { Item, Run, RunEvent, Vec2 } from "./index";
import { AISLE_GRID } from "./market";

const STEP = EDDIE_SPEED / TICKS_PER_SECOND;
const STILL = { x: 0, y: 0 };

const stepStill = (run: Run, ticks: number) =>
  Array.from({ length: ticks }, () =>
    run.step({ move: STILL, sprint: false })
  ).flat();

const stallFor = (item: Item | undefined) => {
  const stall = MARKET.stalls.find((candidate) => candidate.item === item);

  if (!stall) {
    throw new Error(`No Stall for ${item}`);
  }

  return stall;
};

/** Walks along one axis at full speed and lands exactly on `goal`. */
const walkTo = (run: Run, axis: keyof Vec2, goal: number) => {
  const events: RunEvent[] = [];
  const gap = () => goal - run.snapshot().eddie.position[axis];

  while (!run.snapshot().finished && Math.abs(gap()) > 1e-9) {
    const push = Math.max(-1, Math.min(1, gap() / STEP));
    events.push(
      ...run.step({
        move: axis === "x" ? { x: push, y: 0 } : { x: 0, y: push },
        sprint: false,
      })
    );
  }

  return events;
};

/** The first cross aisle in front of (toward the camera from) `y`. */
const aisleInFront = (y: number) =>
  AISLE_GRID.ys.find((aisleY) => aisleY > y) ?? MARKET.bounds.maxY;

/**
 * Walks Eddie by the aisles until he steps onto the near edge of the front
 * zone of the Stall for `item`: out to the cross aisle in front of him, up the
 * nearest aisle between Stalls when the Stall faces another cross aisle, along
 * that aisle to the Stall, then onto its front zone. He never crosses another
 * Stall's front zone.
 */
const visit = (run: Run, item: Item | undefined) => {
  const { area, front } = stallFor(item);
  const { position } = run.snapshot().eddie;
  const fromAisle = aisleInFront(position.y);
  const toAisle = aisleInFront(front.minY);
  const stallX = (area.minX + area.maxX) / 2;

  const [crossX = 0] = AISLE_GRID.xs.toSorted(
    (a, b) =>
      Math.abs(position.x - a) +
      Math.abs(stallX - a) -
      (Math.abs(position.x - b) + Math.abs(stallX - b))
  );

  return [
    ...walkTo(run, "y", fromAisle),
    ...(fromAisle === toAisle
      ? []
      : [...walkTo(run, "x", crossX), ...walkTo(run, "y", toAisle)]),
    ...walkTo(run, "x", stallX),
    ...walkTo(run, "y", front.maxY),
  ];
};

/**
 * A seed whose first Shopping Lists sit close together, so back-to-back visits
 * stay inside the 4 s Combo window even when a Crowd slows Eddie.
 */
const QUICK_SEED = 3;

const listItems = (run: Run) =>
  run.snapshot().shoppingList.items.map(({ item }) => item);

const ticked = (run: Run) =>
  run
    .snapshot()
    .shoppingList.items.filter((entry) => entry.ticked)
    .map(({ item }) => item);

describe("Shopping Lists", () => {
  test("a Run starts with a Shopping List of 3 distinct Items, none ticked", () => {
    const { shoppingList } = createRun({ seed: 1 }).snapshot();

    expect(DISHES.map((dish) => dish.name)).toContain(shoppingList.dish);
    expect(shoppingList.items).toHaveLength(3);
    expect(new Set(shoppingList.items.map(({ item }) => item)).size).toBe(3);

    for (const { item, ticked: done } of shoppingList.items) {
      expect(ITEMS).toContain(item);
      expect(done).toBe(false);
    }
  });
});

describe("Pickups", () => {
  test("walking into the front of a Stall on the list grabs its Item", () => {
    const run = createRun({ seed: 1 });
    const [first] = listItems(run);

    const events = visit(run, first);

    expect(ticked(run)).toEqual([first]);
    expect(events).toEqual([
      { type: "item-grabbed", item: first, combo: 1, points: 100 },
    ]);
    expect(run.snapshot().score).toBe(100);
    expect(run.snapshot().itemsGrabbed).toBe(1);
  });
});

describe("Stalls off the list", () => {
  test("walking into a Stall not on the list does nothing", () => {
    const run = createRun({ seed: 1 });
    const offList = ITEMS.filter((item) => !listItems(run).includes(item));

    const events = offList.flatMap((item) => visit(run, item));

    expect(events).toEqual([]);
    expect(ticked(run)).toEqual([]);
    expect(run.snapshot().score).toBe(0);
  });

  test("a grabbed Item is not grabbed again", () => {
    const run = createRun({ seed: 1 });
    const [first] = listItems(run);
    visit(run, first);

    const events = [...walkTo(run, "x", 0), ...visit(run, first)];

    expect(events).toEqual([]);
    expect(run.snapshot().itemsGrabbed).toBe(1);
  });
});

describe("Completing a Shopping List", () => {
  test("Items can be grabbed in any order", () => {
    const run = createRun({ seed: 1 });
    const [first, second, third] = listItems(run);

    visit(run, third);
    visit(run, first);

    expect(new Set(ticked(run))).toEqual(new Set([first, third]));
    expect(ticked(run)).not.toContain(second);
  });

  test("the last Item clears the list and the next list appears in the same tick", () => {
    const run = createRun({ seed: 1 });
    const { dish } = run.snapshot().shoppingList;
    const [first, second, third] = listItems(run);
    visit(run, second);
    visit(run, third);
    const before = run.snapshot().tick;

    const events = visit(run, first);

    const clearTick = run.snapshot().tick;
    expect(events.map((event) => event.type)).toEqual([
      "item-grabbed",
      "shopping-list-cleared",
    ]);
    expect(events[1]).toEqual({
      type: "shopping-list-cleared",
      dish,
      points: 300,
    });
    expect(clearTick).toBeGreaterThan(before);
    expect(run.snapshot().shoppingList.items).toHaveLength(3);
    expect(ticked(run)).toEqual([]);
    expect(run.snapshot().shoppingListsCleared).toBe(1);
  });

  test("a quick clear scores 100 + 200 + 300 for the Items and 300 for the list", () => {
    const run = createRun({ seed: QUICK_SEED });

    for (const item of listItems(run)) {
      visit(run, item);
    }

    expect(run.snapshot().score).toBe(900);
  });

  test("the next list never asks for the Item Eddie just grabbed", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const run = createRun({ seed });
      const items = listItems(run);

      for (const item of items) {
        visit(run, item);
      }

      expect(listItems(run)).not.toContain(items.at(-1));
    }
  });

  test("the seed sets the order of the lists", () => {
    const firstDishes = new Set(
      Array.from(
        { length: 20 },
        (_, seed) => createRun({ seed }).snapshot().shoppingList.dish
      )
    );

    expect(firstDishes.size).toBeGreaterThan(1);
    expect(createRun({ seed: 7 }).snapshot().shoppingList).toEqual(
      createRun({ seed: 7 }).snapshot().shoppingList
    );
  });
});

describe("Combo", () => {
  test("quick pickups grow the Combo from ×1 to ×2 to ×3", () => {
    const run = createRun({ seed: QUICK_SEED });

    const combos = listItems(run).map((item) => {
      visit(run, item);

      return run.snapshot().combo;
    });

    expect(combos).toEqual([1, 2, 3]);
    expect(run.snapshot().bestCombo).toBe(3);
  });

  test("the Combo stops at ×3", () => {
    const run = createRun({ seed: QUICK_SEED });

    for (const item of listItems(run)) {
      visit(run, item);
    }

    const [next] = listItems(run);

    const events = visit(run, next);

    expect(events).toEqual([
      { type: "item-grabbed", item: next, combo: 3, points: 300 },
    ]);
  });

  test("the Combo drops to ×1 once 4 s (240 ticks) pass with no pickup", () => {
    const run = createRun({ seed: QUICK_SEED });
    const [first, second, third] = listItems(run);
    visit(run, first);
    visit(run, second);

    stepStill(run, 240);
    expect(run.snapshot().combo).toBe(2);

    stepStill(run, 1);
    expect(run.snapshot().combo).toBe(1);

    const events = visit(run, third);
    expect(events[0]).toEqual({
      type: "item-grabbed",
      item: third,
      combo: 1,
      points: 100,
    });
    expect(run.snapshot().bestCombo).toBe(2);
  });
});

describe("The Run's end", () => {
  test("the Run ends at exactly 5,400 ticks", () => {
    const run = createRun({ seed: 1 });

    const early = stepStill(run, 5399);
    expect(run.snapshot().finished).toBe(false);
    expect(run.snapshot().ticksLeft).toBe(1);
    // Phase changes and Hazard hits happen on the way, but the Run goes on.
    expect(early).not.toContainEqual({ type: "run-ended" });

    expect(run.step({ move: STILL, sprint: false })).toEqual([
      { type: "run-ended" },
    ]);
    expect(run.snapshot().finished).toBe(true);
    expect(run.snapshot().ticksLeft).toBe(0);
    expect(run.snapshot().tick).toBe(RUN_TICKS);
  });

  test("steps after the end change nothing", () => {
    const run = createRun({ seed: 1 });
    stepStill(run, RUN_TICKS);
    const ended = run.snapshot();

    expect(run.step({ move: { x: 1, y: 0 }, sprint: false })).toEqual([]);
    expect(run.snapshot()).toBe(ended);
  });

  test("time left counts steps, not wall-clock time, so a paused Run loses none", () => {
    vi.useFakeTimers();

    try {
      const run = createRun({ seed: 1 });
      stepStill(run, 60);

      vi.advanceTimersByTime(30_000);

      expect(run.snapshot().ticksLeft).toBe(RUN_TICKS - 60);
    } finally {
      vi.useRealTimers();
    }
  });
});

/** A fast scripted route: always walks to the needed Item on the closest row. */
/** About how far Eddie walks from `position` to the front of the Stall for `item`. */
const walkLength = (position: Vec2, item: Item) => {
  const { front } = stallFor(item);

  return (
    Math.abs((front.minX + front.maxX) / 2 - position.x) +
    Math.abs(front.minY - position.y)
  );
};

const playFullRun = (seed: number) => {
  const run = createRun({ seed });
  const events: RunEvent[] = [];

  while (!run.snapshot().finished) {
    const { position } = run.snapshot().eddie;

    const [nearest] = run
      .snapshot()
      .shoppingList.items.filter((entry) => !entry.ticked)
      .map(({ item }) => item)
      .toSorted((a, b) => walkLength(position, a) - walkLength(position, b));

    events.push(...visit(run, nearest));
  }

  return { run, events };
};

describe("A full Run", () => {
  test("the result summary matches the Run's events", () => {
    const { run, events } = playFullRun(3);

    const { score, itemsGrabbed, shoppingListsCleared, bestCombo } =
      run.snapshot();

    const grabs = events.filter((event) => event.type === "item-grabbed");

    const clears = events.filter(
      (event) => event.type === "shopping-list-cleared"
    );

    expect(itemsGrabbed).toBe(grabs.length);
    expect(shoppingListsCleared).toBe(clears.length);
    expect(bestCombo).toBe(Math.max(...grabs.map((event) => event.combo)));
    expect(score).toBe(
      [...grabs, ...clears].reduce((sum, event) => sum + event.points, 0)
    );
    expect(events.at(-1)).toEqual({ type: "run-ended" });
    expect(shoppingListsCleared).toBeGreaterThan(5);
  });

  test("a fast scripted route never beats the Score cap", () => {
    for (const seed of [1, 2, 3]) {
      expect(playFullRun(seed).run.snapshot().score).toBeLessThanOrEqual(
        maxScore()
      );
    }
  });

  test("the Score cap allows the pace of a player who Sprints all Run", () => {
    // At 5.4 units/s, the nearest front is 13 ticks away and the shortest
    // gap takes 18 ticks. That leaves time for 300 Items and 100 list clears.
    expect(maxScore()).toBeGreaterThanOrEqual(119_700);
  });

  test("the same seed and route give the same Score", () => {
    expect(playFullRun(5).run.snapshot()).toEqual(
      playFullRun(5).run.snapshot()
    );
  });
});
