import { BURST_COLORS, useHaptics, useInkBurst, usePlop } from "@plop-ui/react";
import { useEffect } from "react";
import type { RefObject } from "react";

import type { RunLoop } from "../run-loop";
import { createFeedback } from "./feedback";
import { createSoundPlayer } from "./sound-player";

// One player for the page: it owns the audio lock, which opens only once.
const player = createSoundPlayer();

/**
 * Wires the events of a Run to the real effects: sound through Web Audio,
 * vibration through Plop's haptics, the Shopping List burst through Plop's
 * ink burst. Each follows the one `PlopProvider`: sound and haptics only when
 * on, bursts never under reduced motion.
 */
export const useRunFeedback = (
  loop: RunLoop,
  listAnchor: RefObject<HTMLElement | null>
) => {
  const { sound } = usePlop();
  const haptics = useHaptics();
  const inkBurst = useInkBurst();

  useEffect(
    () => (sound ? player.unlockOnGesture(window) : undefined),
    [sound]
  );

  useEffect(
    () =>
      loop.subscribeEvents(
        createFeedback({
          sound: (name) => {
            if (sound) {
              player.play(name);
            }
          },
          haptic: (name) => {
            if (name === "grab") {
              haptics.tap();
            } else {
              haptics.error();
            }
          },
          burst: () => {
            if (listAnchor.current) {
              inkBurst(listAnchor.current, BURST_COLORS.all, 14, "stars");
            }
          },
        })
      ),
    [loop, sound, haptics, inkBurst, listAnchor]
  );
};
