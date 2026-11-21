import type { RunSnapshot } from "@eddie-at-bangmod/game";
import {
  Button,
  ButtonLink,
  Heading,
  Sheet,
  WordSticker,
} from "@plop-ui/react";

import { RouterLink } from "@/components/router-link";
import { SettingsMenu } from "@/components/settings-menu";
import { useLanguage } from "@/lib/localization/language-provider";
import { lettered } from "@/lib/localization/lettering";

import { PostScore } from "./post-score";
import type { TicketState } from "./post-score";

/**
 * The results Sheet: this Run's Score and breakdown, posting to the
 * Leaderboard, "Play again" and the Leaderboard link.
 */
export const RunResults = ({
  run,
  ticket,
  onPlayAgain,
}: {
  run: RunSnapshot;
  ticket: TicketState;
  onPlayAgain: () => void;
}) => {
  const { text } = useLanguage();
  const { results } = text;

  return (
    <section
      aria-labelledby="run-results-title"
      className="absolute inset-0 flex items-center-safe justify-center overflow-y-auto p-4"
    >
      <Sheet
        tape="periwinkle"
        tilt={-1}
        className="flex w-full max-w-72 flex-col items-center gap-3 p-5 text-center"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <Heading level={2} id="run-results-title" writeOn={false}>
            {lettered(results.timeUp)}
          </Heading>
          <SettingsMenu />
        </div>
        <p className="m-0" style={{ fontFamily: "var(--plop-font-body)" }}>
          <span className="sr-only">{text.score}: </span>
          <WordSticker tone="mustard" size={56}>
            {String(run.score)}
          </WordSticker>
        </p>
        <dl
          className="m-0 grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-left"
          style={{ fontFamily: "var(--plop-font-body)" }}
        >
          <dt>{results.items}</dt>
          <dd className="m-0 text-right">{run.itemsGrabbed}</dd>
          <dt>{results.cleared}</dt>
          <dd className="m-0 text-right">{run.shoppingListsCleared}</dd>
          <dt>{results.bestCombo}</dt>
          <dd className="m-0 text-right">{`×${run.bestCombo}`}</dd>
        </dl>
        <PostScore score={run.score} ticket={ticket} />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={onPlayAgain}
            variant="periwinkle"
            buddy
            buddyMood="congrats"
          >
            {lettered(results.playAgain)}
          </Button>
          <ButtonLink
            as={RouterLink}
            href="/leaderboard"
            variant="mint"
            size="sm"
          >
            {lettered(text.leaderboard)}
          </ButtonLink>
        </div>
      </Sheet>
    </section>
  );
};
