import type { Item } from "./market";
import type { Random } from "./random";

/** Every Shopping List names a Thai dish and asks for its 3 Items. */
export const DISHES = [
  { name: "kaprao", items: ["basil", "pork", "chili"] },
  { name: "khai-jiao", items: ["egg", "fish-sauce", "rice"] },
  { name: "tom-yum", items: ["chili", "lime", "fish-sauce"] },
  { name: "khao-pad", items: ["rice", "egg", "garlic"] },
  { name: "moo-kratiem", items: ["pork", "garlic", "fish-sauce"] },
  { name: "nam-jim", items: ["chili", "garlic", "lime"] },
  { name: "larb-moo", items: ["pork", "lime", "chili"] },
  { name: "kaprao-khai-dao", items: ["basil", "egg", "rice"] },
] as const satisfies readonly {
  name: string;
  items: readonly [Item, Item, Item];
}[];

export type Dish = (typeof DISHES)[number]["name"];

export interface ShoppingList {
  readonly dish: Dish;
  readonly items: readonly { readonly item: Item; readonly ticked: boolean }[];
}

/**
 * Draws the next Shopping List from the seeded order. It never asks for the
 * Item Eddie just grabbed, so he must walk to another Stall before his next
 * pickup.
 */
export const drawShoppingList = (
  random: Random,
  lastItem?: Item
): ShoppingList => {
  const choices = DISHES.filter(
    ({ items }) => !items.some((item) => item === lastItem)
  );

  const { name, items } =
    choices[Math.floor(random() * choices.length)] ?? DISHES[0];

  return { dish: name, items: items.map((item) => ({ item, ticked: false })) };
};
