import { Callout } from "@plop-ui/react";
import { useSyncExternalStore } from "react";

/**
 * A touch screen held sideways and too short for the portrait card: a phone
 * in landscape. Tablets in landscape are tall enough to show the card.
 */
const PHONE_LANDSCAPE =
  "(orientation: landscape) and (pointer: coarse) and (max-height: 500px)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_LANDSCAPE);
  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

const getIsPhoneLandscape = () => window.matchMedia(PHONE_LANDSCAPE).matches;
const getServerSnapshot = () => false;

/** True while a phone is held in landscape. */
export const usePhoneLandscape = () =>
  useSyncExternalStore(subscribe, getIsPhoneLandscape, getServerSnapshot);

/** Asks the player to turn a phone upright. The Run waits meanwhile. */
export const RotateNotice = () => (
  <output className="block max-w-sm">
    <Callout tone="info" title="Rotate your phone" buddy>
      Market Run plays upright. Turn your phone to portrait to keep going. The
      Run waits for you.
    </Callout>
  </output>
);
