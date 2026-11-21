import { validateNickname } from "@eddie-at-bangmod/api/nickname";
import type { NicknameReason } from "@eddie-at-bangmod/api/nickname";
import { isDefinedError } from "@orpc/client";
import {
  BURST_COLORS,
  Button,
  Callout,
  Tag,
  TextField,
  WordSticker,
  useInkBurst,
} from "@plop-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";

import { getDevice, saveNickname } from "@/lib/device";
import { useLanguage } from "@/lib/localization/language-provider";
import { lettered } from "@/lib/localization/lettering";
import { orpc } from "@/utils/orpc";

/** The Run Ticket for this Run, as far as the client knows. */
export type TicketState =
  | { status: "pending" }
  | { status: "ready"; ticketId: string }
  | { status: "failed" };

/** The "New best!" sticker. It bursts once, as it appears, unless motion is reduced. */
const NewBest = () => {
  const { language, text } = useLanguage();
  const sticker = useRef<HTMLDivElement>(null);
  const inkBurst = useInkBurst();

  useEffect(() => {
    if (sticker.current) {
      inkBurst(sticker.current, BURST_COLORS.all, 18, "confetti");
    }
  }, [inkBurst]);

  return (
    <div ref={sticker} className="flex justify-center">
      {language === "th" ? (
        <Tag tone="tomato" tilt={-3}>
          <span className="text-2xl">{lettered(text.results.newBest)}</span>
        </Tag>
      ) : (
        <WordSticker tone="tomato" size={28} tilt={-3}>
          {text.results.newBest}
        </WordSticker>
      )}
    </div>
  );
};

/**
 * Posts this Run's Score under a Nickname, then shows this Run's rank, the
 * Device's best Score and best rank.
 */
export const PostScore = ({
  score,
  ticket,
}: {
  score: number;
  ticket: TicketState;
}) => {
  const { text } = useLanguage();
  const { results } = text;
  const [nickname, setNickname] = useState(() => getDevice().nickname);
  const [nicknameError, setNicknameError] = useState<NicknameReason>();
  const submit = useMutation(orpc.run.submit.mutationOptions());

  if (ticket.status === "failed") {
    return (
      <Callout tone="error" title={lettered(results.notPosted)} role="alert">
        {results.noTicket}
      </Callout>
    );
  }

  if (submit.data) {
    return (
      // oxlint-disable-next-line jsx-a11y/no-autofocus -- the posted form is gone, so focus moves to its result.
      <output tabIndex={-1} autoFocus className="flex w-full flex-col gap-2">
        {submit.data.newBest && <NewBest />}
        <dl
          className="m-0 grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 text-left"
          style={{ fontFamily: "var(--plop-font-body)" }}
        >
          <dt>{results.thisRun}</dt>
          <dd className="m-0 text-right">
            <Tag tone="mustard">{`#${submit.data.runRank}`}</Tag>
          </dd>
          <dt>{results.bestScore}</dt>
          <dd className="m-0 text-right">{submit.data.bestScore}</dd>
          <dt>{results.bestRank}</dt>
          <dd className="m-0 text-right">
            <Tag tone="mint">{`#${submit.data.bestRank}`}</Tag>
          </dd>
        </dl>
      </output>
    );
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = validateNickname(nickname);

    if (!parsed.success) {
      setNicknameError(parsed.reason);

      return;
    }

    if (ticket.status !== "ready") {
      return;
    }

    setNicknameError(undefined);
    submit.mutate(
      {
        ticketId: ticket.ticketId,
        deviceId: getDevice().id,
        nickname: parsed.nickname,
        score,
      },
      {
        onSuccess: () => {
          saveNickname(parsed.nickname);
        },
      }
    );
  };

  const { error } = submit;

  let reason = nicknameError;
  let postError: string | undefined;

  if (isDefinedError(error)) {
    if (error.code === "INVALID_NICKNAME") {
      reason ??= error.data.reason;
    } else {
      postError = results.postErrors[error.code];
    }
  } else if (error !== null) {
    postError = text.rankings.retry;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col items-stretch gap-3 text-left"
    >
      <TextField
        label={text.nickname}
        name="nickname"
        autoComplete="nickname"
        value={nickname}
        onChange={(event) => {
          setNickname(event.target.value);
        }}
        hint={results.nicknameHint}
        error={
          reason === undefined ? undefined : results.nicknameErrors[reason]
        }
      />
      {postError !== undefined && (
        <Callout tone="error" title={lettered(results.notPosted)} role="alert">
          {postError}
        </Callout>
      )}
      <Button
        type="submit"
        size="sm"
        loading={submit.isPending || ticket.status === "pending"}
        loadingLabel={results.posting}
      >
        {lettered(results.post)}
      </Button>
    </form>
  );
};
