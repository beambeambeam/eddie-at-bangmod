import { expect, test } from "vite-plus/test";

import { createMoveInput } from "./move-input";

/** Presses a key on `target` and tells whether the input stopped its default. */
const press = (target: EventTarget, code: string) => {
  const event = Object.assign(new Event("keydown", { cancelable: true }), {
    code,
  });

  target.dispatchEvent(event);

  return event.defaultPrevented;
};

test("WASD on the page moves Eddie and keeps the page from scrolling", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  expect(press(page, "KeyW")).toBe(true);
  expect(input.read()).toEqual({ x: 0, y: -1 });
});

test("WASD typed into a text field types and leaves Eddie still", () => {
  const field = Object.assign(new EventTarget(), { tagName: "INPUT" });
  const input = createMoveInput();
  input.listen(field);

  expect(press(field, "KeyW")).toBe(false);
  expect(press(field, "ArrowLeft")).toBe(false);
  expect(input.read()).toEqual({ x: 0, y: 0 });
});
