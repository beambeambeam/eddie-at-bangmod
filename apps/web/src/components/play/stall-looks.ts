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

interface StallLook {
  /** The Stall sign text, shown by the Plop overlay. */
  label: string;
  /** Plop spot color for the sign and the awning. */
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
