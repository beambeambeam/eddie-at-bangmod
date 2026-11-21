import type { MoveInput, Vec2 } from "@eddie-at-bangmod/game";

const KEY_DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
} satisfies Record<string, Vec2>;

type DirectionKey = keyof typeof KEY_DIRECTIONS;

type SprintKey = "ShiftLeft" | "ShiftRight";

const isDirectionKey = (code: string): code is DirectionKey =>
  Object.hasOwn(KEY_DIRECTIONS, code);

const isSprintKey = (code: string): code is SprintKey =>
  code === "ShiftLeft" || code === "ShiftRight";

const TEXT_TAGS = new Set<unknown>(["INPUT", "TEXTAREA", "SELECT"]);

/** True when a key goes into a text field, such as the Nickname field. */
const isTyping = (target: EventTarget | null) => {
  if (target === null) {
    return false;
  }

  if ("isContentEditable" in target && target.isContentEditable === true) {
    return true;
  }

  return "tagName" in target && TEXT_TAGS.has(target.tagName);
};

/** True for a browser or system shortcut, such as Cmd+D or Ctrl+S. */
const isShortcut = (event: KeyboardEvent) =>
  event.metaKey || event.ctrlKey || event.altKey;

/**
 * Merges keyboard and floating joystick controls.
 * A held joystick wins over the keys. Keys typed into a text field stay
 * there: they neither move Eddie nor lose their default.
 */
export interface MoveInputSource {
  read: () => MoveInput;
  setJoystick: (move: MoveInput | null) => void;
  /** Listens for keys on `target`, usually the window. Returns a function that stops it. */
  listen: (
    target: Pick<Window, "addEventListener" | "removeEventListener">
  ) => () => void;
}

export const createMoveInput = (): MoveInputSource => {
  const held = new Set<DirectionKey | SprintKey>();
  let joystick: MoveInput | null = null;
  let shortcutHeld = false;

  const onKeyDown = (event: KeyboardEvent) => {
    shortcutHeld = isShortcut(event);

    if (shortcutHeld || isTyping(event.target)) {
      return;
    }

    if (isSprintKey(event.code)) {
      held.add(event.code);
    } else if (isDirectionKey(event.code)) {
      event.preventDefault();
      held.add(event.code);
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    shortcutHeld = isShortcut(event);

    if (isDirectionKey(event.code) || isSprintKey(event.code)) {
      held.delete(event.code);
    }

    // While Cmd is down, macOS sends no keyup for other keys, so a key let go
    // in that time would stay held forever.
    if (event.code === "MetaLeft" || event.code === "MetaRight") {
      held.clear();
    }
  };

  const onBlur = () => {
    held.clear();
    shortcutHeld = false;
  };

  return {
    read() {
      if (joystick) {
        return joystick;
      }

      let x = 0;
      let y = 0;

      for (const code of held) {
        if (isDirectionKey(code)) {
          x += KEY_DIRECTIONS[code].x;
          y += KEY_DIRECTIONS[code].y;
        }
      }

      return {
        move: { x, y },
        sprint:
          (x !== 0 || y !== 0) &&
          !shortcutHeld &&
          (held.has("ShiftLeft") || held.has("ShiftRight")),
      };
    },
    setJoystick(move) {
      joystick = move;
    },
    listen(target) {
      target.addEventListener("keydown", onKeyDown);
      target.addEventListener("keyup", onKeyUp);
      target.addEventListener("blur", onBlur);

      return () => {
        target.removeEventListener("keydown", onKeyDown);
        target.removeEventListener("keyup", onKeyUp);
        target.removeEventListener("blur", onBlur);
        onBlur();
      };
    },
  };
};
