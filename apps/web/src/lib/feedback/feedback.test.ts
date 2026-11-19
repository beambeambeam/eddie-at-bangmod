import { expect, test, vi } from "vite-plus/test";

import type { LoopEvent } from "../run-loop";
import { cuesFor } from "./cues";
import type { BurstName, HapticName, SoundName } from "./cues";
import { createFeedback } from "./feedback";

test("an Item grab pops and buzzes a short tap", () => {
  expect(
    cuesFor({ type: "item-grabbed", item: "basil", combo: 1, points: 100 })
  ).toEqual([
    { kind: "sound", sound: "item-pop" },
    { kind: "haptic", haptic: "grab" },
  ]);
});

test("clearing a Shopping List plays the jingle and bursts stickers", () => {
  expect(
    cuesFor({ type: "shopping-list-cleared", dish: "kaprao", points: 300 })
  ).toEqual([
    { kind: "sound", sound: "list-clear" },
    { kind: "burst", burst: "list-clear" },
  ]);
});

test("a Motorbike hit honks and a Soi Dog hit barks, both with a hit buzz", () => {
  expect(cuesFor({ type: "eddie-hit", hazard: "motorbike" })).toEqual([
    { kind: "sound", sound: "honk" },
    { kind: "haptic", haptic: "hit" },
  ]);
  expect(cuesFor({ type: "eddie-hit", hazard: "soi-dog" })).toEqual([
    { kind: "sound", sound: "bark" },
    { kind: "haptic", haptic: "hit" },
  ]);
});

test("each countdown tick ticks, and the start of the Run has its own sound", () => {
  expect(cuesFor({ type: "countdown-tick", count: 3 })).toEqual([
    { kind: "sound", sound: "countdown-tick" },
  ]);
  expect(cuesFor({ type: "run-started" })).toEqual([
    { kind: "sound", sound: "go" },
  ]);
});

test("the end of the Run blows the whistle", () => {
  expect(cuesFor({ type: "run-ended" })).toEqual([
    { kind: "sound", sound: "end-whistle" },
  ]);
});

test("a Phase change is silent", () => {
  expect(cuesFor({ type: "phase-changed", phase: 2 })).toEqual([]);
});

const adapters = () => ({
  sound: vi.fn<(sound: SoundName) => void>(),
  haptic: vi.fn<(haptic: HapticName) => void>(),
  burst: vi.fn<(burst: BurstName) => void>(),
});

test("each cue goes to its own adapter", () => {
  const { sound, haptic, burst } = adapters();
  const feedback = createFeedback({ sound, haptic, burst });

  feedback([
    { type: "item-grabbed", item: "egg", combo: 2, points: 200 },
    { type: "shopping-list-cleared", dish: "kaprao", points: 300 },
    { type: "eddie-hit", hazard: "motorbike" },
  ]);

  expect(sound.mock.calls).toEqual([["item-pop"], ["list-clear"], ["honk"]]);
  expect(haptic.mock.calls).toEqual([["grab"], ["hit"]]);
  expect(burst.mock.calls).toEqual([["list-clear"]]);
});

test("events with no cues call no adapter", () => {
  const { sound, haptic, burst } = adapters();

  createFeedback({ sound, haptic, burst })([
    { type: "phase-changed", phase: 3 },
  ]);

  expect(sound).not.toHaveBeenCalled();
  expect(haptic).not.toHaveBeenCalled();
  expect(burst).not.toHaveBeenCalled();
});

test("a failing adapter never stops the others or the next event", () => {
  const { sound, burst } = adapters();

  const haptic = vi.fn<(haptic: HapticName) => void>(() => {
    throw new Error("vibration is not supported");
  });

  const events: LoopEvent[] = [
    { type: "eddie-hit", hazard: "soi-dog" },
    { type: "item-grabbed", item: "lime", combo: 1, points: 100 },
  ];

  expect(() => {
    createFeedback({ sound, haptic, burst })(events);
  }).not.toThrow();
  expect(sound.mock.calls).toEqual([["bark"], ["item-pop"]]);
  expect(haptic).toHaveBeenCalledTimes(2);
});
