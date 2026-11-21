import type { Item } from "@eddie-at-bangmod/game";
import type { TagTone } from "@plop-ui/react";

/** How high the awning sits. Stall signs are pinned at this height too. */
export const AWNING_HEIGHT = 2;

/**
 * The awning sits over the back of the Stall, above the Vendor, so the aisle
 * in front stays clear and the camera still sees the Vendor under its edge.
 */
export const AWNING_OFFSET = -0.42;

/** How far the awning reaches from back to front. */
export const AWNING_DEPTH = 0.6;

/** Plop spot color for the sign and the awning. */
export const STALL_TONES: Record<Item, Exclude<TagTone, "ink">> = {
  basil: "mint",
  pork: "bubblegum",
  egg: "mustard",
  rice: "periwinkle",
  chili: "tomato",
  garlic: "periwinkle",
  "fish-sauce": "mustard",
  lime: "mint",
};
