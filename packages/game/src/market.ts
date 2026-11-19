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
const STALL_COLUMNS = [-2, 2];
const STALL_ROWS = [-4.2, -1.4, 1.4, 4.2];

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

/**
 * The single fixed Market: two columns of four Stalls with aisles between
 * them. `x` points right, `y` points down the screen. Every Run uses it.
 */
export const MARKET = {
  bounds: { minX: -4.5, minY: -6, maxX: 4.5, maxY: 6 } satisfies Rect,
  stalls: ITEMS.map(stallAt),
} as const;
