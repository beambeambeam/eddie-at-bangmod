import { beforeEach, expect, test } from "vite-plus/test";

import { lockRunTouch } from "./touch-lock";

/** A stand-in page: events, and a root element for the CSS mark. */
const makePage = () => {
  const dataset: DOMStringMap = {};

  return Object.assign(new EventTarget(), { documentElement: { dataset } });
};

let page: ReturnType<typeof makePage>;

beforeEach(() => {
  page = makePage();
});

/** Fires a cancelable event and tells whether the page stopped its default. */
const blocked = (type: string) => {
  const event = new Event(type, { cancelable: true });
  page.dispatchEvent(event);

  return event.defaultPrevented;
};

// The long-press menu, text selection, iOS pinch-zoom, and page scroll or
// pull-to-refresh from a drag.
const RUN_GESTURES = [
  "contextmenu",
  "selectstart",
  "gesturestart",
  "touchmove",
];

test("during a Run, no long-press menu, text select, pinch-zoom or scroll starts", () => {
  lockRunTouch(page);

  for (const gesture of RUN_GESTURES) {
    expect(blocked(gesture), gesture).toBe(true);
  }
});

test("after the Run, the page scrolls, selects and zooms again", () => {
  const unlock = lockRunTouch(page);
  unlock();

  for (const gesture of RUN_GESTURES) {
    expect(blocked(gesture), gesture).toBe(false);
  }
});
