import type { RunSnapshot } from "@eddie-at-bangmod/game";
import { Button, Heading, Sheet, WordSticker } from "@plop-ui/react";

/** The results Sheet: this Run's Score, its breakdown, and "Play again". */
export const RunResults = ({
  run,
  onPlayAgain,
}: {
  run: RunSnapshot;
  onPlayAgain: () => void;
}) => (
  <section
    aria-labelledby="run-results-title"
    className="absolute inset-0 flex items-center justify-center p-4"
  >
    <Sheet
      tape="periwinkle"
      tilt={-1}
      className="flex w-full max-w-72 flex-col items-center gap-3 p-5 text-center"
    >
      <Heading level={2} id="run-results-title" writeOn={false}>
        Time&apos;s up!
      </Heading>
      <p className="m-0" style={{ fontFamily: "var(--plop-font-body)" }}>
        <span className="sr-only">Score: </span>
        <WordSticker tone="mustard" size={56}>
          {String(run.score)}
        </WordSticker>
      </p>
      <dl
        className="m-0 mb-10 grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-left"
        style={{ fontFamily: "var(--plop-font-body)" }}
      >
        <dt>Items</dt>
        <dd className="m-0 text-right">{run.itemsGrabbed}</dd>
        <dt>Shopping Lists cleared</dt>
        <dd className="m-0 text-right">{run.shoppingListsCleared}</dd>
        <dt>Best Combo</dt>
        <dd className="m-0 text-right">{`×${run.bestCombo}`}</dd>
      </dl>
      {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the results replace the whole Run, so focus moves to the next action. */}
      <Button autoFocus onClick={onPlayAgain} buddy buddyMood="congrats">
        Play again
      </Button>
    </Sheet>
  </section>
);
