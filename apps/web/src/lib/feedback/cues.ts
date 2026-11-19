import type { LoopEvent } from "../run-loop";

/** Every sound the game makes. There is no music. */
export type SoundName =
  | "item-pop"
  | "list-clear"
  | "honk"
  | "bark"
  | "countdown-tick"
  | "go"
  | "end-whistle";

/** The two vibrations: a short tap on a grabbed Item, a firm buzz on a hit. */
export type HapticName = "grab" | "hit";

export type BurstName = "list-clear";

/** One thing to play, vibrate or draw. Each kind has its own adapter. */
export type Cue =
  | { readonly kind: "sound"; readonly sound: SoundName }
  | { readonly kind: "haptic"; readonly haptic: HapticName }
  | { readonly kind: "burst"; readonly burst: BurstName };

const sound = (name: SoundName): Cue => ({ kind: "sound", sound: name });
const haptic = (name: HapticName): Cue => ({ kind: "haptic", haptic: name });
const burst = (name: BurstName): Cue => ({ kind: "burst", burst: name });

/** What an event of the Run should sound, feel and look like. */
export const cuesFor = (event: LoopEvent): readonly Cue[] => {
  switch (event.type) {
    case "item-grabbed": {
      return [sound("item-pop"), haptic("grab")];
    }

    case "shopping-list-cleared": {
      return [sound("list-clear"), burst("list-clear")];
    }

    case "eddie-hit": {
      return [
        sound(event.hazard === "motorbike" ? "honk" : "bark"),
        haptic("hit"),
      ];
    }

    case "countdown-tick": {
      return [sound("countdown-tick")];
    }

    case "run-started": {
      return [sound("go")];
    }

    case "run-ended": {
      return [sound("end-whistle")];
    }

    case "phase-changed": {
      return [];
    }

    default: {
      return [];
    }
  }
};
