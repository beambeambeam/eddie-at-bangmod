import { beforeEach, expect, test, vi } from "vite-plus/test";

import { createSoundPlayer } from "./sound-player";

/** Whether the browser counts the current gesture as a real tap. */
let gestureCounts = true;

interface FakeAudio {
  state: AudioContextState | "interrupted";
  sampleRate: number;
  destination: object;
  resume: () => Promise<void>;
  createBuffer: () => object;
  createBufferSource: () => object;
}

let made: FakeAudio | undefined;

/**
 * A stand-in for the browser's audio. `resume` unlocks it only when the
 * browser counts the current gesture as a real tap, as iOS and Android do.
 */
const FakeAudioContext = function FakeAudioContext() {
  const plays = {
    connect: () => {
      // The stand-in plays nothing.
    },
    start: () => {
      // The stand-in plays nothing.
    },
  };

  const fake: FakeAudio = {
    state: "suspended",
    sampleRate: 44_100,
    destination: {},
    resume: async () => {
      await Promise.resolve();

      if (gestureCounts) {
        fake.state = "running";
      }
    },
    createBuffer: () => ({}),
    createBufferSource: () => ({ buffer: null, ...plays }),
  };

  made = fake;

  return fake;
};

const audio = () => {
  if (!made) {
    throw new Error("No audio was made");
  }

  return made;
};

/** Lets the unlock's promise settle. */
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

let page: EventTarget;

beforeEach(() => {
  gestureCounts = true;
  made = undefined;
  vi.stubGlobal("AudioContext", FakeAudioContext);
  page = new EventTarget();
});

test("when the first touch does not count as a tap, the next one still unlocks audio", async () => {
  createSoundPlayer().unlockOnGesture(page);

  // Android Chrome and iOS do not let a finger going down start audio.
  gestureCounts = false;
  page.dispatchEvent(new Event("pointerdown"));
  await settle();
  expect(audio().state).toBe("suspended");

  gestureCounts = true;
  page.dispatchEvent(new Event("touchend"));
  await settle();
  expect(audio().state).toBe("running");
});

test("after iOS interrupts audio, such as for a call, the next tap unlocks it again", async () => {
  createSoundPlayer().unlockOnGesture(page);
  page.dispatchEvent(new Event("touchend"));
  await settle();

  audio().state = "interrupted";
  page.dispatchEvent(new Event("touchend"));
  await settle();
  expect(audio().state).toBe("running");
});

test("once stopped, taps leave the audio alone", async () => {
  const stop = createSoundPlayer().unlockOnGesture(page);
  stop();
  page.dispatchEvent(new Event("touchend"));
  await settle();

  expect(made).toBeUndefined();
});
