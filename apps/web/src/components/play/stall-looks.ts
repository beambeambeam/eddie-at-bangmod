import type { Item } from "@eddie-at-bangmod/game";
import type { TagTone } from "@plop-ui/react";

/** Where the Stall sign stands on the counter: left of the goods. */
export const SIGN_X = -0.78;

/** Depth of the sign on the counter, from the Stall's center toward the camera. */
export const SIGN_Z = 0.2;

/** How tall the sign looks on screen, in Market units. */
export const SIGN_HEIGHT = 0.95;

/** The counter's top, in world height. Goods and the sign stand on it. */
export const COUNTER_HEIGHT = 0.72;

interface StallLook {
  /** The Stall sign text, shown by the Plop overlay. */
  label: string;
  /** Plop spot color for the counter and the label. */
  tone: Exclude<TagTone, "ink">;
}

export const STALL_LOOKS: Record<Item, StallLook> = {
  basil: { label: "Basil", tone: "mint" },
  pork: { label: "Pork", tone: "bubblegum" },
  egg: { label: "Egg", tone: "mustard" },
  rice: { label: "Rice", tone: "periwinkle" },
  chili: { label: "Chili", tone: "tomato" },
  garlic: { label: "Garlic", tone: "periwinkle" },
  "fish-sauce": { label: "Fish Sauce", tone: "mustard" },
  lime: { label: "Lime", tone: "mint" },
};
