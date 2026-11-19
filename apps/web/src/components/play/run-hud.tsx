import { TICKS_PER_SECOND } from "@eddie-at-bangmod/game";
import type { RunSnapshot, ShoppingList } from "@eddie-at-bangmod/game";
import { Sheet, Tag, WordSticker } from "@plop-ui/react";

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

/**
 * Everything a player reads during a Run, as Plop UI over the canvas
 * (ADR-0003): time left, Score, Combo and the Shopping List.
 */
export const RunHud = ({ view }: { view: RunView }) => {
  const { stage, countdown, run } = view;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2">
      <Scoreboard run={run} />
      <output aria-live="assertive">
        {stage === "countdown" && <Call>{String(countdown)}</Call>}
        {stage === "running" && run.tick < GO_TICKS && <Call>Go!</Call>}
      </output>
      {stage !== "finished" && <ShoppingListCard list={run.shoppingList} />}
    </div>
  );
};
