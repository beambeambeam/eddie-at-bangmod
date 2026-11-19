import { PHASE_TICKS, TICKS_PER_SECOND } from "@eddie-at-bangmod/game";
import type { Phase, RunSnapshot, ShoppingList } from "@eddie-at-bangmod/game";
import { Sheet, Tag, WordSticker } from "@plop-ui/react";
import type { Ref } from "react";

import type { RunView } from "@/lib/run-loop";

import { DISH_LABELS } from "./dish-looks";
import { STALL_LOOKS } from "./stall-looks";

/** "1:05" from ticks left, rounded up so the clock reads 0:00 only at the end. */
const clock = (ticksLeft: number) => {
  const seconds = Math.ceil(ticksLeft / TICKS_PER_SECOND);

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

const ShoppingListCard = ({ list }: { list: ShoppingList }) => (
  // The HUD card stays slim so it never hides the front row of Stalls.
  <Sheet tape="none" tilt={-0.5} style={{ padding: "6px 12px" }}>
    <h2
      className="m-0 text-sm uppercase"
      style={{ fontFamily: "var(--plop-font-letter)" }}
    >
      <span className="sr-only">Shopping List: </span>
      {DISH_LABELS[list.dish]}
    </h2>
    <ul className="m-0 mt-0.5 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-sm">
      {list.items.map(({ item, ticked }) => (
        <li
          key={item}
          className="flex items-center gap-1"
          style={{
            fontFamily: "var(--plop-font-body)",
            textDecoration: ticked ? "line-through" : undefined,
          }}
        >
          <span aria-hidden>{ticked ? "☑" : "☐"}</span>
          {STALL_LOOKS[item].label}
          <span className="text-xs uppercase opacity-80">
            {ticked ? "got" : "need"}
          </span>
        </li>
      ))}
    </ul>
  </Sheet>
);

const Scoreboard = ({ run }: { run: RunSnapshot }) => (
  <div className="flex items-start justify-between gap-2">
    <dl className="m-0 flex flex-wrap gap-2">
      <div>
        <dt className="sr-only">Time left</dt>
        <dd className="m-0">
          <Tag tone="ink" pattern="grid" tilt={-2}>
            {`⏱ ${clock(run.ticksLeft)}`}
          </Tag>
        </dd>
      </div>
      <div>
        <dt className="sr-only">Phase</dt>
        <dd className="m-0">
          <Tag tone="mint" pattern="stripes" tilt={-1}>
            {`Phase ${run.phase}`}
          </Tag>
        </dd>
      </div>
      <div>
        <dt className="sr-only">Score</dt>
        <dd className="m-0">
          <Tag tone="mustard" pattern="dots" tilt={1}>
            {`Score ${run.score}`}
          </Tag>
        </dd>
      </div>
    </dl>
    <WordSticker
      tone={run.combo > 1 ? "tomato" : "paper"}
      size={22}
      tilt={4}
    >{`Combo ×${run.combo}`}</WordSticker>
  </div>
);

/** A big lettered call in the middle of the frame: 3, 2, 1, Go! */
const Call = ({ children }: { children: string }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <WordSticker tone="mustard" size={96} tilt={-4}>
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
 * Everything a player reads during a Run, as Plop UI over the canvas
 * (ADR-0003): time left, Phase, Score, Combo, Phase calls, the Stun and the
 * Shopping List.
 */
export const RunHud = ({
  view,
  listRef,
}: {
  view: RunView;
  /** The Shopping List card, where the list-clear burst starts. */
  listRef: Ref<HTMLDivElement>;
}) => {
  const { stage, countdown, run } = view;
  const call = stage === "running" ? phaseCall(run) : null;
  const stunned = stage === "running" && run.eddie.stunTicksLeft > 0;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2">
      <Scoreboard run={run} />
      <output aria-live="assertive">
        {stage === "countdown" && <Call>{String(countdown)}</Call>}
        {stage === "running" && run.tick < GO_TICKS && <Call>Go!</Call>}
        {call !== null && <Call>{call}</Call>}
        {stunned && (
          <div className="absolute inset-x-0 top-1/3 flex justify-center">
            <WordSticker tone="tomato" size={40} tilt={3}>
              Stunned!
            </WordSticker>
          </div>
        )}
      </output>
      {stage !== "finished" && (
        <div ref={listRef}>
          <ShoppingListCard list={run.shoppingList} />
        </div>
      )}
    </div>
  );
};
