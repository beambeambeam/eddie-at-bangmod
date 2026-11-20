/** A point or direction on the Market floor. `x` points right, `y` down the screen. */
export interface Vec2 {
  x: number;
  y: number;
}

/** An axis-aligned rectangle on the Market floor, in Market units. */
export interface Rect {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export const ITEMS = [
  "basil",
  "pork",
  "egg",
  "rice",
  "chili",
  "garlic",
  "fish-sauce",
  "lime",
] as const;

/** A thing Eddie can pick up from a Stall. */
export type Item = (typeof ITEMS)[number];

/** A place in the Market that offers one Item. Eddie cannot walk through it. */
export interface Stall {
  readonly item: Item;
  /** The Stall's footprint on the Market floor. */
  readonly area: Rect;
  /**
   * The strip of aisle in front of the Stall, toward the camera. Eddie grabs
   * the Item when he stands in it and the Item is on his Shopping List.
   */
  readonly front: Rect;
}

const STALL_WIDTH = 2.4;
const STALL_DEPTH = 1.2;
const FRONT_DEPTH = 0.8;
const STALL_COLUMNS = [-6, -2, 2, 6];
const STALL_ROWS = [-2.2, 1.8];

const stallAt = (item: Item, index: number): Stall => {
  const x = STALL_COLUMNS[index % STALL_COLUMNS.length] ?? 0;
  const y = STALL_ROWS[Math.floor(index / STALL_COLUMNS.length)] ?? 0;

  const minX = x - STALL_WIDTH / 2;
  const maxX = x + STALL_WIDTH / 2;
  const maxY = y + STALL_DEPTH / 2;

  return {
    item,
    area: { minX, minY: y - STALL_DEPTH / 2, maxX, maxY },
    front: { minX, minY: maxY, maxX, maxY: maxY + FRONT_DEPTH },
  };
};

/** The x of the side aisles and the aisles between Stalls, which run up the screen. */
const AISLE_XS = [-7.85, -4, 0, 4, 7.85];

/** The y of the cross aisles, from the back of the Market to the front. */
const AISLE_YS = [-3.9, 0.2, 4.2];

/**
 * The aisle crossings. Two crossings next to each other in the grid are
 * joined by a clear aisle, so Hazards walk between them without a Stall in the
 * way.
 */
export const AISLE_GRID = { xs: AISLE_XS, ys: AISLE_YS } as const;

/** A fixed lane where Motorbikes cross the whole Market. */
export interface MotorbikeLane {
  readonly y: number;
  /** +1 rides to the right, -1 to the left. */
  readonly heading: 1 | -1;
}

/**
 * The single fixed Market: four columns of two Stalls with aisles between
 * them, wider than deep so it fills a landscape screen. `x` points right, `y` points down the screen. Every Run uses it.
 */
export const MARKET = {
  bounds: { minX: -8.5, minY: -5, maxX: 8.5, maxY: 5 } satisfies Rect,
  stalls: ITEMS.map(stallAt),
  /** The middle and front cross aisles double as Motorbike lanes, one each way. */
  motorbikeLanes: [
    { y: AISLE_YS[1] ?? 0, heading: 1 },
    { y: AISLE_YS[2] ?? 0, heading: -1 },
  ] satisfies readonly MotorbikeLane[],
} as const;
