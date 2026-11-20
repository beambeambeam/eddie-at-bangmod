import { expect, test } from "vite-plus/test";

import { createMoveInput } from "./move-input";

interface Modifiers {
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

/** Sends a key event to `target` and tells whether the input stopped its default. */
const key = (
  type: "keydown" | "keyup",
  target: EventTarget,
  code: string,
  modifiers: Modifiers = {}
) => {
  const event = Object.assign(new Event(type, { cancelable: true }), {
    code,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    ...modifiers,
  });

  target.dispatchEvent(event);

  return event.defaultPrevented;
};

const press = (target: EventTarget, code: string, modifiers?: Modifiers) =>
  key("keydown", target, code, modifiers);

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

test("a shortcut such as Cmd+D or Ctrl+S keeps working and moves no one", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  expect(press(page, "KeyD", { metaKey: true })).toBe(false);
  expect(press(page, "KeyS", { ctrlKey: true })).toBe(false);
  expect(input.read()).toEqual({ x: 0, y: 0 });
});

test("letting go of Cmd drops held keys, since macOS hides their keyup", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  press(page, "KeyW");
  press(page, "MetaLeft", { metaKey: true });
  key("keyup", page, "MetaLeft");

  expect(input.read()).toEqual({ x: 0, y: 0 });
});
