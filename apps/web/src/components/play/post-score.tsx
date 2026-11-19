import { nicknameSchema } from "@eddie-at-bangmod/api/nickname";
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
import { orpc } from "@/utils/orpc";

/** The Run Ticket for this Run, as far as the client knows. */
export type TicketState =
  | { status: "pending" }
  | { status: "ready"; ticketId: string }
  | { status: "failed" };

/** The "New best!" sticker. It bursts once, as it appears, unless motion is reduced. */
const NewBest = () => {
  const sticker = useRef<HTMLDivElement>(null);
  const inkBurst = useInkBurst();

  useEffect(() => {
    if (sticker.current) {
      inkBurst(sticker.current, BURST_COLORS.all, 18, "confetti");
    }
  }, [inkBurst]);

  return (
    <div ref={sticker} className="flex justify-center">
      <WordSticker tone="tomato" size={28} tilt={-3}>
        New best!
      </WordSticker>
    </div>
  );
};

const OFFLINE_MESSAGE =
  "Could not reach the Leaderboard. Check your connection and try again.";

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
  const [nickname, setNickname] = useState(() => getDevice().nickname);
  const [nicknameError, setNicknameError] = useState<string>();
  const submit = useMutation(orpc.run.submit.mutationOptions());

  if (ticket.status === "failed") {
    return (
      <Callout tone="error" title="Score not posted" role="alert">
        This Run could not get a Run Ticket, so it cannot post. Check your
        connection and play again.
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
          <dt>This Run</dt>
          <dd className="m-0 text-right">
            <Tag tone="mustard">{`#${submit.data.runRank}`}</Tag>
          </dd>
          <dt>Best Score</dt>
          <dd className="m-0 text-right">{submit.data.bestScore}</dd>
          <dt>Best rank</dt>
          <dd className="m-0 text-right">
            <Tag tone="mint">{`#${submit.data.bestRank}`}</Tag>
          </dd>
        </dl>
      </output>
    );
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = nicknameSchema.safeParse(nickname);

    if (!parsed.success) {
      setNicknameError(parsed.error.issues[0]?.message);

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
        nickname: parsed.data,
        score,
      },
      {
        onSuccess: () => {
          saveNickname(parsed.data);
        },
      }
    );
  };

  const { error } = submit;

  const serverNicknameError =
    isDefinedError(error) && error.code === "INVALID_NICKNAME"
      ? error.message
      : undefined;

  let postError: string | undefined;

  // A broken server rule names its own problem. Anything else means no
  // connection.
  if (error !== null && serverNicknameError === undefined) {
    postError = isDefinedError(error) ? error.message : OFFLINE_MESSAGE;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col items-stretch gap-3 text-left"
    >
      <TextField
        label="Nickname"
        name="nickname"
        autoComplete="nickname"
        value={nickname}
        onChange={(event) => {
          setNickname(event.target.value);
        }}
        hint="2–16 Thai or Latin letters, digits or spaces"
        error={nicknameError ?? serverNicknameError}
      />
      {postError !== undefined && (
        <Callout tone="error" title="Score not posted" role="alert">
          {postError}
        </Callout>
      )}
      <Button
        type="submit"
        size="sm"
        loading={submit.isPending || ticket.status === "pending"}
        loadingLabel="Posting"
      >
        Post Score
      </Button>
    </form>
  );
};
