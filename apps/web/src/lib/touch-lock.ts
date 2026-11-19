/** The page as the lock needs it: events, and the root element for CSS. */
interface LockablePage extends EventTarget {
  documentElement: { dataset: DOMStringMap };
}

/**
 * Gestures a Run turns off: the long-press menu, text selection, iOS
 * pinch-zoom, and page scroll or pull-to-refresh from a drag.
 */
const BLOCKED = ["contextmenu", "selectstart", "gesturestart", "touchmove"];

const cancelDefault = (event: Event) => {
  event.preventDefault();
};

/**
 * Locks the page for a Run: no gesture moves, zooms or selects the page, so
 * every touch steers Eddie. It also marks the root element (`data-run-lock`)
 * so CSS turns off double-tap-zoom and the callout menu. Returns the unlock.
 */
export const lockRunTouch = (page: LockablePage) => {
  for (const type of BLOCKED) {
    // Not passive: iOS and Chrome only let a listener stop a touch scroll
    // when it says up front that it may.
    page.addEventListener(type, cancelDefault, { passive: false });
  }

  page.documentElement.dataset.runLock = "";

  return () => {
    for (const type of BLOCKED) {
      page.removeEventListener(type, cancelDefault);
    }

    delete page.documentElement.dataset.runLock;
  };
};
