import type { LoopEvent } from "../run-loop";
import type { BurstName, HapticName, SoundName } from "./cues";
import { cuesFor } from "./cues";

/**
 * The effects of the game, one adapter each. Swap one to change how that
 * effect is made: no other effect, and no rule of the game, changes with it.
 */
export interface FeedbackAdapters {
  sound: (sound: SoundName) => void;
  haptic: (haptic: HapticName) => void;
  burst: (burst: BurstName) => void;
}

/**
 * Turns the events of a Run into effects. An adapter that throws (a browser
 * without vibration, audio blocked until a tap) never stops the other
 * effects, the next event or the Run.
 */
export const createFeedback =
  (adapters: FeedbackAdapters) => (events: readonly LoopEvent[]) => {
    for (const event of events) {
      for (const cue of cuesFor(event)) {
        try {
          switch (cue.kind) {
            case "sound": {
              adapters.sound(cue.sound);
              break;
            }

            case "haptic": {
              adapters.haptic(cue.haptic);
              break;
            }

            case "burst": {
              adapters.burst(cue.burst);
              break;
            }

            default: {
              break;
            }
          }
        } catch {
          // Feedback is never worth breaking a Run for.
        }
      }
    }
  };
