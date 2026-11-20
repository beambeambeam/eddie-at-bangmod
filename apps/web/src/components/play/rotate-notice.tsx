import { Button, Callout } from "@plop-ui/react";
import { useSyncExternalStore } from "react";

import { enterLandscape } from "@/lib/landscape";

/**
 * A touch screen held upright and too narrow for the landscape frame: a
 * phone in portrait. Tablets in portrait are wide enough to show the frame.
 */
const PHONE_PORTRAIT =
  "(orientation: portrait) and (pointer: coarse) and (max-width: 600px)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_PORTRAIT);
  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

const getIsPhonePortrait = () => window.matchMedia(PHONE_PORTRAIT).matches;
const getServerSnapshot = () => false;

/** True while a phone is held upright. */
export const usePhonePortrait = () =>
  useSyncExternalStore(subscribe, getIsPhonePortrait, getServerSnapshot);

/**
 * Asks the player to turn a phone sideways. The Run waits meanwhile. Where
 * the browser can, the button goes fullscreen and turns the screen for them.
 */
export const RotateNotice = () => (
  <output className="flex max-w-sm flex-col items-center gap-4">
    <Callout tone="info" title="Rotate your phone" buddy>
      Market Run plays sideways. Turn your phone to landscape to keep going. The
      Run waits for you.
    </Callout>
    <Button
      onClick={() => {
        void enterLandscape();
      }}
    >
      Play fullscreen
    </Button>
  </output>
);
