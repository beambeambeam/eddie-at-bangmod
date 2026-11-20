import type { MoveInput } from "@eddie-at-bangmod/game";

const KEY_DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
} satisfies Record<string, MoveInput>;

type DirectionKey = keyof typeof KEY_DIRECTIONS;

const isDirectionKey = (code: string): code is DirectionKey =>
  Object.hasOwn(KEY_DIRECTIONS, code);

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

/**
 * Merges WASD/arrow keys and the floating joystick into one movement input.
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
  const held = new Set<DirectionKey>();
  let joystick: MoveInput | null = null;

  const onKeyDown = (event: KeyboardEvent) => {
    if (isDirectionKey(event.code) && !isTyping(event.target)) {
      event.preventDefault();
      held.add(event.code);
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (isDirectionKey(event.code)) {
      held.delete(event.code);
    }
  };

  const onBlur = () => {
    held.clear();
  };

  return {
    read() {
      if (joystick) {
        return joystick;
      }

      let x = 0;
      let y = 0;

      for (const code of held) {
        x += KEY_DIRECTIONS[code].x;
        y += KEY_DIRECTIONS[code].y;
      }

      return { x, y };
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
        held.clear();
      };
    },
  };
};
