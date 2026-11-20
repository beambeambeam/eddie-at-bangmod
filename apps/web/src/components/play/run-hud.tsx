import { PHASE_TICKS, TICKS_PER_SECOND } from "@eddie-at-bangmod/game";
import type { Phase, RunSnapshot, ShoppingList } from "@eddie-at-bangmod/game";
import { Sheet, Tag, WordSticker } from "@plop-ui/react";
import type { WordStickerTone } from "@plop-ui/react";
import type { Ref } from "react";

import type { RunView } from "@/lib/run-loop";

import { DISH_LABELS } from "./dish-looks";
import { STALL_LOOKS } from "./stall-looks";

/** "1:05" from ticks left, rounded up so the clock reads 0:00 only at the end. */
const clock = (ticksLeft: number) => {
  const seconds = Math.ceil(ticksLeft / TICKS_PER_SECOND);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/** Rail text that grows with its rail: small on phones, big on wide screens. */
const RAIL_TEXT = "clamp(1rem, 11cqi, 1.75rem)";
const RAIL_NUMBER = "clamp(1.5rem, 20cqi, 3.5rem)";

/** The Shopping List as its own rail card, so it never hides a Stall. */
export const ShoppingListCard = ({
  list,
  listRef,
}: {
  list: ShoppingList;
  /** The card, where the list-clear burst starts. */
  listRef: Ref<HTMLDivElement>;
}) => (
  <div ref={listRef} className="@container w-full">
    <Sheet tape="none" tilt={-0.5} className="w-full p-[clamp(8px,6cqi,20px)]">
      <h2
        className="m-0 uppercase"
        style={{ fontFamily: "var(--plop-font-letter)", fontSize: RAIL_TEXT }}
      >
        <span className="sr-only">Shopping List: </span>
        {DISH_LABELS[list.dish]}
      </h2>
      <ul
        className="m-0 mt-2 flex list-none flex-col gap-2 p-0"
        style={{ fontSize: RAIL_TEXT }}
      >
        {list.items.map(({ item, ticked }) => (
          <li
            key={item}
            className="flex flex-wrap items-center gap-x-2"
            style={{
              fontFamily: "var(--plop-font-body)",
              textDecoration: ticked ? "line-through" : undefined,
            }}
          >
            <span aria-hidden>{ticked ? "☑" : "☐"}</span>
            {STALL_LOOKS[item].label}
            <span className="text-[0.6em] uppercase opacity-80">
              {ticked ? "got" : "need"}
            </span>
          </li>
        ))}
      </ul>
    </Sheet>
  </div>
);

/** One labelled reading on the scoreboard rail, e.g. "Time 1:05". */
const Reading = ({
  label,
  value,
  tone,
  tilt,
}: {
  label: string;
  value: string;
  tone: WordStickerTone;
  tilt: number;
}) => (
  <div className="flex flex-col items-center">
    <dt
      className="uppercase"
      style={{ fontFamily: "var(--plop-font-letter)", fontSize: RAIL_TEXT }}
    >
      {label}
    </dt>
    <dd className="m-0">
      <WordSticker tone={tone} tilt={tilt} style={{ fontSize: RAIL_NUMBER }}>
        {value}
      </WordSticker>
    </dd>
  </div>
);

/** Time left, Score, Combo and Phase, big, in their own rail. */
export const Scoreboard = ({ run }: { run: RunSnapshot }) => (
  <dl className="@container m-0 flex w-full flex-wrap items-center justify-around gap-[clamp(4px,4cqi,16px)] landscape:flex-col landscape:justify-center">
    <Reading label="Time" value={clock(run.ticksLeft)} tone="paper" tilt={-2} />
    <Reading label="Score" value={String(run.score)} tone="mustard" tilt={1} />
    <Reading
      label="Combo"
      value={`×${run.combo}`}
      tone={run.combo > 1 ? "tomato" : "paper"}
      tilt={3}
    />
    <div>
      <dt className="sr-only">Phase</dt>
      <dd className="m-0">
        <Tag tone="mint" pattern="stripes" tilt={-1}>
          {`Phase ${run.phase}`}
        </Tag>
      </dd>
    </div>
  </dl>
);

/** A big lettered call in the middle of the frame: 3, 2, 1, Go! */
const Call = ({ children }: { children: string }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <WordSticker
      tone="mustard"
      tilt={-4}
      style={{ fontSize: "min(24cqh, 12cqw)" }}
    >
      {children}
    </WordSticker>
  </div>
);

/** "Go!" stays up for the first half second of the Run. */
const GO_TICKS = TICKS_PER_SECOND / 2;

/** What each new Phase brings into the Market. */
const PHASE_CALLS: Record<Exclude<Phase, 1>, string> = {
  2: "Motorbikes!",
  3: "Soi Dog!",
};

/** A Phase call stays up for the first 1.5 s of its Phase. */
const PHASE_CALL_TICKS = 1.5 * TICKS_PER_SECOND;

const phaseCall = ({ phase, tick }: RunSnapshot) =>
  phase !== 1 && tick - (phase - 1) * PHASE_TICKS < PHASE_CALL_TICKS
    ? PHASE_CALLS[phase]
    : null;

/**
 * The calls a player reads over the Market during a Run, as Plop UI over the
 * canvas (ADR-0003): the countdown, "Go!", Phase calls and the Stun. Time
 * left, Score, Combo, Phase and the Shopping List sit in the rails beside it.
 */
export const RunCalls = ({ view }: { view: RunView }) => {
  const { stage, countdown, run } = view;
  const call = stage === "running" ? phaseCall(run) : null;
  const stunned = stage === "running" && run.eddie.stunTicksLeft > 0;

  return (
    <output
      aria-live="assertive"
      className="pointer-events-none absolute inset-0"
    >
      {stage === "countdown" && <Call>{String(countdown)}</Call>}
      {stage === "running" && run.tick < GO_TICKS && <Call>Go!</Call>}
      {call !== null && <Call>{call}</Call>}
      {stunned && (
        <div className="absolute inset-x-0 top-1/4 flex justify-center">
          <WordSticker
            tone="tomato"
            tilt={3}
            style={{ fontSize: "min(12cqh, 6cqw)" }}
          >
            Stunned!
          </WordSticker>
        </div>
      )}
    </output>
  );
};
