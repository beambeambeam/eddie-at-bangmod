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
  expect(input.read()).toEqual({ move: { x: 0, y: -1 }, sprint: false });
});

test("WASD typed into a text field types and leaves Eddie still", () => {
  const field = Object.assign(new EventTarget(), { tagName: "INPUT" });
  const input = createMoveInput();
  input.listen(field);

  expect(press(field, "KeyW")).toBe(false);
  expect(press(field, "ArrowLeft")).toBe(false);
  expect(input.read()).toEqual({ move: { x: 0, y: 0 }, sprint: false });
});

test("a shortcut such as Cmd+D or Ctrl+S keeps working and moves no one", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  expect(press(page, "KeyD", { metaKey: true })).toBe(false);
  expect(press(page, "KeyS", { ctrlKey: true })).toBe(false);
  expect(input.read()).toEqual({ move: { x: 0, y: 0 }, sprint: false });
});

test("letting go of Cmd drops held keys, since macOS hides their keyup", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  press(page, "KeyW");
  press(page, "ShiftLeft");
  press(page, "MetaLeft", { metaKey: true });
  key("keyup", page, "MetaLeft");

  expect(input.read()).toEqual({ move: { x: 0, y: 0 }, sprint: false });
  press(page, "KeyW");
  expect(input.read().sprint).toBe(false);
});

test("either Shift key requests Sprint only while a direction is held", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  press(page, "ShiftLeft");
  expect(input.read()).toEqual({ move: { x: 0, y: 0 }, sprint: false });

  press(page, "KeyW");
  expect(input.read()).toEqual({ move: { x: 0, y: -1 }, sprint: true });

  press(page, "ShiftRight");
  key("keyup", page, "ShiftLeft");
  expect(input.read().sprint).toBe(true);

  key("keyup", page, "ShiftRight");
  expect(input.read()).toEqual({ move: { x: 0, y: -1 }, sprint: false });
});

test("Shift typed into a text field does not start a Sprint", () => {
  const page = Object.assign(new EventTarget(), { tagName: "INPUT" });
  const input = createMoveInput();
  input.listen(page);

  expect(press(page, "ShiftLeft")).toBe(false);
  page.tagName = "DIV";
  press(page, "KeyW");

  expect(input.read().sprint).toBe(false);
});

test.each([{ metaKey: true }, { ctrlKey: true }, { altKey: true }])(
  "Shift does not Sprint during a shortcut (%j)",
  (modifier) => {
    const page = new EventTarget();
    const input = createMoveInput();
    input.listen(page);

    press(page, "KeyW");
    expect(press(page, "ShiftLeft", modifier)).toBe(false);
    expect(input.read().sprint).toBe(false);
    press(page, "KeyW");
    expect(input.read().sprint).toBe(false);

    press(page, "ShiftLeft");
    expect(press(page, "KeyD", modifier)).toBe(false);
    expect(input.read().sprint).toBe(false);
  }
);

test("window blur clears held Sprint and direction keys", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  press(page, "ShiftLeft");
  press(page, "KeyW");
  page.dispatchEvent(new Event("blur"));
  expect(input.read()).toEqual({ move: { x: 0, y: 0 }, sprint: false });

  press(page, "KeyW");
  expect(input.read().sprint).toBe(false);
});

test("a held joystick overrides both keyboard controls", () => {
  const page = new EventTarget();
  const input = createMoveInput();
  input.listen(page);

  press(page, "ShiftLeft");
  press(page, "KeyW");
  input.setJoystick({ move: { x: 0.5, y: 0 }, sprint: false });
  expect(input.read()).toEqual({ move: { x: 0.5, y: 0 }, sprint: false });

  input.setJoystick(null);
  expect(input.read()).toEqual({ move: { x: 0, y: -1 }, sprint: true });
});
