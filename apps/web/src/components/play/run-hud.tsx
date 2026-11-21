import { PHASE_TICKS, TICKS_PER_SECOND } from "@eddie-at-bangmod/game";
import { Progress, Sheet, Tag, WordSticker } from "@plop-ui/react";
import type { WordStickerTone } from "@plop-ui/react";
import type { Ref } from "react";

import { useLanguage } from "@/lib/localization/language-provider";
import { hasThai, lettered } from "@/lib/localization/lettering";
import type { RunLoop } from "@/lib/run-loop";
import { useRunSelect } from "@/lib/use-run-select";

/** "1:05" from whole seconds left. */
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Rail text that grows with its rail: small on phones, big on wide screens. */
const RAIL_TEXT = "clamp(1rem, 11cqi, 1.75rem)";
const RAIL_NUMBER = "clamp(1.5rem, 20cqi, 3.5rem)";

/**
 * The Shopping List as its own rail card, so it never hides a Stall. It
 * re-renders only when the list changes, not on every tick.
 */
export const ShoppingListCard = ({
  loop,
  listRef,
}: {
  loop: RunLoop;
  /** The card, where the list-clear burst starts. */
  listRef: Ref<HTMLDivElement>;
}) => {
  const { text } = useLanguage();
  const list = useRunSelect(loop, ({ run }) => run.shoppingList);

  return (
    <div ref={listRef} className="@container w-full">
      <Sheet
        tape="none"
        tilt={-0.5}
        className="w-full p-[clamp(8px,6cqi,20px)]"
      >
        <h2
          className="m-0 leading-tight uppercase"
          style={{ fontFamily: "var(--plop-font-letter)", fontSize: RAIL_TEXT }}
        >
          <span className="sr-only">{text.shoppingList}: </span>
          {text.dishes[list.dish]}
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
              {text.items[item]}
              <span className="text-[0.6em] uppercase opacity-80">
                {ticked ? text.market.got : text.market.need}
              </span>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
};

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

const StaminaReading = ({ loop }: { loop: RunLoop }) => {
  const { text } = useLanguage();

  const stamina = useRunSelect(loop, ({ run }) =>
    Math.ceil(run.eddie.stamina * 100)
  );

  const winded = useRunSelect(loop, ({ run }) => run.eddie.winded);

  return (
    <div className="w-28 max-w-full landscape:w-full landscape:max-w-36">
      <dt className="sr-only">{text.market.stamina}</dt>
      <dd className="m-0">
        <Progress
          label={text.market.stamina}
          value={stamina}
          tone={winded ? "tomato" : "mint"}
          solid
          className="[&_[role=progressbar]]:h-4! [&_[role=progressbar]>span]:transition-none!"
        />
        <output className="mt-1 flex min-h-7 justify-center">
          {winded && <Tag tone="tomato">{lettered(text.market.winded)}</Tag>}
        </output>
      </dd>
    </div>
  );
};

/** Time left, Score, Combo, Phase and Stamina in the scoreboard rail. */
export const Scoreboard = ({ loop }: { loop: RunLoop }) => {
  const { text } = useLanguage();

  const seconds = useRunSelect(loop, ({ run }) =>
    Math.ceil(run.ticksLeft / TICKS_PER_SECOND)
  );

  const score = useRunSelect(loop, ({ run }) => run.score);
  const combo = useRunSelect(loop, ({ run }) => run.combo);
  const phase = useRunSelect(loop, ({ run }) => run.phase);

  return (
    <dl className="@container m-0 flex w-full flex-wrap items-center justify-around gap-[clamp(4px,4cqi,16px)] landscape:flex-col landscape:justify-center">
      <Reading
        label={text.market.time}
        value={clock(seconds)}
        tone="paper"
        tilt={-2}
      />
      <Reading
        label={text.score}
        value={String(score)}
        tone="mustard"
        tilt={1}
      />
      <Reading
        label={text.market.combo}
        value={`×${combo}`}
        tone={combo > 1 ? "tomato" : "paper"}
        tilt={3}
      />
      <div>
        <dt className="sr-only">{text.market.phase}</dt>
        <dd className="m-0">
          <Tag tone="mint" pattern="stripes" tilt={-1}>
            {lettered(text.market.phaseNumber(phase))}
          </Tag>
        </dd>
      </div>
      <StaminaReading loop={loop} />
    </dl>
  );
};

const RunCallSticker = ({
  label,
  tone,
  tilt,
  fontSize,
}: {
  label: string;
  tone: "mustard" | "tomato";
  tilt: number;
  fontSize: string;
}) => {
  if (!hasThai(label)) {
    return (
      <WordSticker tone={tone} tilt={tilt} style={{ fontSize }}>
        {label}
      </WordSticker>
    );
  }

  return (
    <Tag tone={tone} tilt={tilt}>
      <span style={{ fontSize: `min(${fontSize}, 7cqw)` }}>
        {lettered(label)}
      </span>
    </Tag>
  );
};

/** "Go!" stays up for the first half second of the Run. */
const GO_TICKS = TICKS_PER_SECOND / 2;

/** A Phase call stays up for the first 1.5 s of its Phase. */
const PHASE_CALL_TICKS = 1.5 * TICKS_PER_SECOND;

/**
 * The calls a player reads over the Market during a Run, as Plop UI over the
 * canvas (ADR-0003): the countdown, "Go!", Phase calls and the Stun. Time
 * left, Score, Combo, Phase and the Shopping List sit in the rails beside it.
 */
export const RunCalls = ({ loop }: { loop: RunLoop }) => {
  const {
    text: { market },
  } = useLanguage();

  const call = useRunSelect(loop, ({ stage, countdown, run }) => {
    if (stage === "countdown") {
      return String(countdown);
    }

    if (stage !== "running") {
      return null;
    }

    if (run.tick < GO_TICKS) {
      return market.go;
    }

    const { phase, tick } = run;

    if (phase !== 1 && tick - (phase - 1) * PHASE_TICKS < PHASE_CALL_TICKS) {
      return phase === 2 ? market.motorbikes : market.dog;
    }

    return null;
  });

  const stunned = useRunSelect(
    loop,
    ({ stage, run }) => stage === "running" && run.eddie.stunTicksLeft > 0
  );

  return (
    <output
      aria-live="assertive"
      className="pointer-events-none absolute inset-0"
    >
      {call !== null && (
        <div className="absolute inset-0 flex items-center justify-center">
          <RunCallSticker
            label={call}
            tone="mustard"
            tilt={-4}
            fontSize="min(24cqh, 12cqw)"
          />
        </div>
      )}
      {stunned && (
        <div className="absolute inset-x-0 top-1/4 flex justify-center">
          <RunCallSticker
            label={market.stunned}
            tone="tomato"
            tilt={3}
            fontSize="min(12cqh, 6cqw)"
          />
        </div>
      )}
    </output>
  );
};
