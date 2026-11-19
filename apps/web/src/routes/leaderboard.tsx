import { ButtonLink, Callout, Heading, Sheet, Tag } from "@plop-ui/react";
import { skipToken, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useSyncExternalStore } from "react";

import { RouterLink } from "@/components/router-link";
import { getDevice, subscribeDevice } from "@/lib/device";
import { orpc } from "@/utils/orpc";

// Bangkok time on server and client alike, so the server render matches.
const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "Asia/Bangkok",
});

const YOU_ROW: CSSProperties = {
  background: "var(--plop-fill-mustard)",
  color: "var(--plop-on-fill-mustard)",
};

/** The Device id, read after hydration. The server has none. */
const useDeviceId = () =>
  useSyncExternalStore<string | null>(
    subscribeDevice,
    () => getDevice().id,
    () => null
  );

interface Row {
  rank: number;
  nickname: string;
  score: number;
  at: Date;
}

const EntryRow = ({ entry, isYou }: { entry: Row; isYou: boolean }) => (
  <tr style={isYou ? YOU_ROW : undefined}>
    <td className="px-2 py-1 text-right">{`#${entry.rank}`}</td>
    <td className="px-2 py-1 break-all">
      {entry.nickname}
      {isYou && (
        <>
          {" "}
          <Tag tone="ink">you</Tag>
        </>
      )}
    </td>
    <td className="px-2 py-1 text-right">{entry.score}</td>
    <td className="px-2 py-1 text-right whitespace-nowrap">
      {dateFormat.format(entry.at)}
    </td>
  </tr>
);

const LeaderboardPage = () => {
  const { data: top } = useSuspenseQuery(orpc.leaderboard.top.queryOptions());
  const deviceId = useDeviceId();

  const { data: me } = useQuery(
    orpc.leaderboard.me.queryOptions({
      input: deviceId === null ? skipToken : { deviceId },
    })
  );

  const pinned = me && me.rank > top.length ? me : undefined;

  return (
    <main className="flex min-h-svh justify-center px-4 py-16">
      <Sheet
        tape="mint"
        tilt={-0.5}
        className="flex w-full max-w-xl flex-col items-center gap-4 p-5"
      >
        <Heading level={1} writeOn={false}>
          Leaderboard
        </Heading>
        {top.length === 0 ? (
          <Callout title="No Scores yet">
            Play a Run and post the first Score.
          </Callout>
        ) : (
          <table
            className="w-full border-collapse"
            style={{ fontFamily: "var(--plop-font-body)" }}
          >
            <caption className="sr-only">
              Top 50 best Scores. A tie goes to whoever reached the Score first.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="px-2 py-1 text-right">
                  Rank
                </th>
                <th scope="col" className="px-2 py-1 text-left">
                  Nickname
                </th>
                <th scope="col" className="px-2 py-1 text-right">
                  Score
                </th>
                <th scope="col" className="px-2 py-1 text-right">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map((entry) => (
                <EntryRow
                  key={entry.rank}
                  entry={entry}
                  isYou={entry.rank === me?.rank}
                />
              ))}
            </tbody>
            {pinned && (
              <tfoot
                style={{
                  borderTop: "var(--plop-stroke) dashed var(--plop-ink)",
                }}
              >
                <tr>
                  <th
                    scope="row"
                    colSpan={4}
                    className="px-2 pt-2 text-left"
                  >{`you: #${pinned.rank}`}</th>
                </tr>
                <EntryRow entry={pinned} isYou />
              </tfoot>
            )}
          </table>
        )}
        <ButtonLink as={RouterLink} href="/play" variant="periwinkle">
          Play
        </ButtonLink>
      </Sheet>
    </main>
  );
};

const LeaderboardError = () => (
  <main className="flex min-h-svh items-center justify-center px-4">
    <Callout tone="error" title="Leaderboard not loaded" role="alert">
      Could not reach the Leaderboard. Check your connection and reload the
      page.
    </Callout>
  </main>
);

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard · Eddie@Bangmod" }] }),
  // Fetches on the server, so the page arrives with the top 50 in it.
  loader: async ({ context }) => {
    await context.queryClient.query(
      context.orpc.leaderboard.top.queryOptions()
    );
  },
  component: LeaderboardPage,
  errorComponent: LeaderboardError,
});
