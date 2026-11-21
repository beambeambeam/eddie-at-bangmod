import type { SoundName } from "./cues";
import { click8bitSound } from "./sounds/click-8bit";
import { errorBuzzSound } from "./sounds/error-buzz";
import { notificationPopSound } from "./sounds/notification-pop";
import type { SoundAsset } from "./sounds/sound-types";
import { successChimeSound } from "./sounds/success-chime";
import { switchOffSound } from "./sounds/switch-off";
import { switchOnSound } from "./sounds/switch-on";

interface SoundSpec {
  asset: SoundAsset;
  volume: number;
  /** Pitch and speed. Below 1 is lower and slower. */
  rate: number;
}

// Every sound comes from the UI category of soundcn.xyz (Kenney, CC0). Its
// UI set has no horn or bark, so the buzz stands in for both, pitched apart.
const SOUNDS: Record<SoundName, SoundSpec> = {
  "item-pop": { asset: notificationPopSound, volume: 0.7, rate: 1 },
  "list-clear": { asset: successChimeSound, volume: 0.9, rate: 1 },
  honk: { asset: errorBuzzSound, volume: 0.9, rate: 0.6 },
  bark: { asset: errorBuzzSound, volume: 0.9, rate: 1.5 },
  winded: { asset: switchOffSound, volume: 0.7, rate: 1.3 },
  "countdown-tick": { asset: click8bitSound, volume: 0.8, rate: 1 },
  go: { asset: switchOnSound, volume: 0.8, rate: 1 },
  "end-whistle": { asset: switchOffSound, volume: 0.9, rate: 1 },
};

const decode = async (context: AudioContext, { dataUri }: SoundAsset) => {
  const base64 = dataUri.slice(dataUri.indexOf(",") + 1);

  const bytes = Uint8Array.from(
    atob(base64),
    (char) => char.codePointAt(0) ?? 0
  );

  return await context.decodeAudioData(bytes.buffer);
};

const start = (audio: AudioContext, buffer: AudioBuffer, spec: SoundSpec) => {
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  source.buffer = buffer;
  source.playbackRate.value = spec.rate;
  gain.gain.value = spec.volume;
  source.connect(gain).connect(audio.destination);
  source.start();
};

/** Audio the browser refuses or cannot decode is skipped: sound is never worth an error. */
const ignoreFailure = () => {
  // Nothing to do: the sound is lost and the game goes on.
};

/**
 * Plays the game's sounds with the Web Audio API. Browsers keep audio locked
 * until a tap or key press, so a sound asked for while locked is dropped, not
 * queued: a late burst of old sounds is worse than silence. Each tap or key
 * press tries to open the lock while it is closed.
 */
export interface SoundPlayer {
  play: (sound: SoundName) => void;
  /** Opens the audio lock on a tap or key press whenever it is closed. Returns a function that stops listening. */
  unlockOnGesture: (target: EventTarget) => () => void;
}

const GESTURES = ["pointerdown", "touchend", "keydown"] as const;

export const createSoundPlayer = (): SoundPlayer => {
  let context: AudioContext | undefined;
  const buffers = new Map<SoundName, Promise<AudioBuffer>>();

  const contextNow = () => {
    context ??= new AudioContext();

    return context;
  };

  const bufferFor = async (name: SoundName) => {
    let buffer = buffers.get(name);

    if (!buffer) {
      buffer = decode(contextNow(), SOUNDS[name].asset);
      buffers.set(name, buffer);
    }

    return await buffer;
  };

  const playRunning = async (audio: AudioContext, name: SoundName) => {
    try {
      start(audio, await bufferFor(name), SOUNDS[name]);
    } catch {
      // A failed decode is retried by the next play.
      buffers.delete(name);
    }
  };

  const unlockNow = async () => {
    const audio = contextNow();

    try {
      const resumed = audio.resume();
      // iOS Safari unlocks audio only when a sound starts inside the tap, so
      // the silent sound starts before anything awaits.
      const silence = audio.createBufferSource();
      silence.buffer = audio.createBuffer(1, 1, audio.sampleRate);
      silence.connect(audio.destination);
      silence.start();
      await resumed;
    } catch {
      // Still locked: the next tap tries again.
    }
  };

  // Not every gesture counts: a finger going down does not on Android Chrome
  // or iOS, and iOS locks audio again after a call. So every gesture tries
  // while audio is not running.
  const unlockIfLocked = () => {
    if (contextNow().state !== "running") {
      void unlockNow();
    }
  };

  return {
    play(name) {
      const audio = contextNow();

      if (audio.state === "running") {
        void playRunning(audio, name);
      } else {
        // Locked, or the page just left a call: drop the sound, ask to wake.
        audio.resume().catch(ignoreFailure);
      }
    },
    unlockOnGesture(target) {
      for (const gesture of GESTURES) {
        target.addEventListener(gesture, unlockIfLocked);
      }

      return () => {
        for (const gesture of GESTURES) {
          target.removeEventListener(gesture, unlockIfLocked);
        }
      };
    },
  };
};
