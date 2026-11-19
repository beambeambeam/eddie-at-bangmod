import { ITEMS } from "@eddie-at-bangmod/game";
import { expect, test } from "vite-plus/test";

import {
  SPRITE_SLOTS,
  eddieSlot,
  itemSlot,
  signSlot,
  spriteUrl,
} from "./slots";

const artFiles = import.meta.glob("./art/*.svg", { query: "?url" });

test("the sprite set covers every slot the Market needs", () => {
  const expected = [
    "eddie-front",
    "eddie-back",
    "eddie-left",
    "eddie-right",
    "vendor",
    "motorbike",
    "soi-dog",
    "crowd",
    ...ITEMS.map((item) => `item-${item}`),
    ...ITEMS.map((item) => `sign-${item}`),
  ];

  expect(SPRITE_SLOTS).toHaveLength(expected.length);
  expect(SPRITE_SLOTS).toEqual(expect.arrayContaining(expected));
});

test("each slot is one file in the art folder, and no file is left over", () => {
  const files = Object.keys(artFiles).map((path) =>
    path.replace("./art/", "").replace(".svg", "")
  );

  expect(files).toHaveLength(SPRITE_SLOTS.length);
  expect(files).toEqual(expect.arrayContaining([...SPRITE_SLOTS]));
});

test("every slot resolves to its own texture url", () => {
  const urls = SPRITE_SLOTS.map(spriteUrl);

  expect(urls.every((url) => url.length > 0)).toBe(true);
  expect(new Set(urls).size).toBe(SPRITE_SLOTS.length);
});

test("Items and Stall signs map to their own slots", () => {
  expect(itemSlot("fish-sauce")).toBe("item-fish-sauce");
  expect(signSlot("lime")).toBe("sign-lime");
});

test("Eddie shows the facing that matches his strongest direction", () => {
  // y points down the screen, toward the camera.
  expect(eddieSlot({ x: 0, y: 1 })).toBe("eddie-front");
  expect(eddieSlot({ x: 0, y: -1 })).toBe("eddie-back");
  expect(eddieSlot({ x: -1, y: 0 })).toBe("eddie-left");
  expect(eddieSlot({ x: 1, y: 0 })).toBe("eddie-right");
  expect(eddieSlot({ x: 0.8, y: -0.6 })).toBe("eddie-right");
  expect(eddieSlot({ x: -0.5, y: 0.85 })).toBe("eddie-front");
});

test("a diagonal facing keeps the side view, so Eddie never flips on a tie", () => {
  expect(eddieSlot({ x: Math.SQRT1_2, y: Math.SQRT1_2 })).toBe("eddie-right");
  expect(eddieSlot({ x: -Math.SQRT1_2, y: -Math.SQRT1_2 })).toBe("eddie-left");
});
