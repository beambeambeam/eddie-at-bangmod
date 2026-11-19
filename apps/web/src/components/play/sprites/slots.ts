import { ITEMS } from "@eddie-at-bangmod/game";
import type { Item, Vec2 } from "@eddie-at-bangmod/game";

type EddieSlot = "eddie-front" | "eddie-back" | "eddie-left" | "eddie-right";

type ItemSlot = `item-${Item}`;

type SignSlot = `sign-${Item}`;

/**
 * Every sprite the Market draws. Each slot is exactly one file,
 * `art/<slot>.svg`. Swap that file to replace the sprite; nothing else knows
 * how a slot is drawn. A slot without its file fails the slot tests.
 */
export type SpriteSlot =
  | EddieSlot
  | ItemSlot
  | SignSlot
  | "vendor"
  | "motorbike"
  | "soi-dog"
  | "crowd";

export const itemSlot = (item: Item): SpriteSlot => `item-${item}`;

export const signSlot = (item: Item): SpriteSlot => `sign-${item}`;

export const SPRITE_SLOTS: readonly SpriteSlot[] = [
  "eddie-front",
  "eddie-back",
  "eddie-left",
  "eddie-right",
  "vendor",
  "motorbike",
  "soi-dog",
  "crowd",
  ...ITEMS.map(itemSlot),
  ...ITEMS.map(signSlot),
];

/**
 * The Eddie sprite for a facing. `y` points down the screen, toward the
 * camera. A diagonal keeps the side view, so a tie never flips the sprite.
 */
export const eddieSlot = ({ x, y }: Vec2): SpriteSlot => {
  if (Math.abs(x) >= Math.abs(y) - 1e-3) {
    return x < 0 ? "eddie-left" : "eddie-right";
  }

  return y < 0 ? "eddie-back" : "eddie-front";
};

const urls = import.meta.glob<string>("./art/*.svg", {
  query: "?url",
  import: "default",
  eager: true,
});

/** The texture url of a slot's file. */
export const spriteUrl = (slot: SpriteSlot): string => {
  const url = urls[`./art/${slot}.svg`];

  if (url === undefined) {
    throw new Error(`Sprite slot "${slot}" has no file in art/.`);
  }

  return url;
};
