import { IconButton, InfoIcon } from "@plop-ui/react";
import { useMutation } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { FloatingJoystick } from "@/components/play/floating-joystick";
import { HowTo } from "@/components/play/how-to";
import type { TicketState } from "@/components/play/post-score";
import {
  RotateNotice,
  usePhoneLandscape,
} from "@/components/play/rotate-notice";
import { RunHud } from "@/components/play/run-hud";
import { RunResults } from "@/components/play/run-results";
import { StallSigns } from "@/components/play/stall-signs";
import { getDevice, markHowToSeen, subscribeDevice } from "@/lib/device";
import { useRunFeedback } from "@/lib/feedback/use-run-feedback";
import { createMoveInput } from "@/lib/move-input";
import { createRunLoop } from "@/lib/run-loop";
import { lockRunTouch } from "@/lib/touch-lock";
import { orpc } from "@/utils/orpc";

// Three.js loads only on the client, and only on this page.
const MarketScene = lazy(async () => {
  const module = await import("@/components/play/market-scene");

  return { default: module.MarketScene };
});

// Nothing ever changes: this store only tells the server render from the client.
const subscribeNever = () => () => {
  // Nothing to stop: no listener was added.
};

const newSeed = () => Math.floor(Math.random() * 2 ** 32);

const PlayPage = () => {
  const input = useMemo(() => createMoveInput(), []);
  // Each "Play again" starts a fresh Run with a new seed.
  const [seed, setSeed] = useState(newSeed);
  const loop = useMemo(() => createRunLoop(seed, input.read), [input, seed]);

  const view = useSyncExternalStore(
    loop.subscribe,
    loop.getSnapshot,
    loop.getSnapshot
  );

  // Each Run asks for its Run Ticket as its countdown starts.
  const startRun = useMutation(orpc.run.start.mutationOptions());
  const { mutate: requestTicket } = startRun;
  let ticket: TicketState = { status: "pending" };

  if (startRun.data) {
    ticket = { status: "ready", ticketId: startRun.data.ticketId };
  } else if (startRun.isError) {
    ticket = { status: "failed" };
  }

  const listRef = useRef<HTMLDivElement>(null);
  useRunFeedback(loop, listRef);

  // The how-to shows before a Device's first Run, and "?" opens it again.
  // The server cannot know either, so until the page is hydrated the Run
  // is held and nothing shows.
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  const seenHowTo = useSyncExternalStore(
    subscribeDevice,
    () => getDevice().seenHowTo,
    () => true
  );

  const [reopened, setReopened] = useState(false);
  const howToOpen = hydrated && (!seenHowTo || reopened);
  const phoneLandscape = usePhoneLandscape();

  // While the Run is live, every touch steers Eddie. It stays locked behind
  // the rotate notice, so a stray drag cannot pull-to-refresh the Run away.
  const touchLocked =
    (view.stage === "countdown" || view.stage === "running") && !howToOpen;

  const handleCloseHowTo = () => {
    markHowToSeen();
    setReopened(false);
  };

  const handleJoystick = input.setJoystick;

  const handlePlayAgain = () => {
    setSeed(newSeed());
  };

  useEffect(() => input.listen(window), [input]);
  // No time passes behind the how-to Sheet or the rotate notice.
  useEffect(() => {
    loop.setHeld(!hydrated || howToOpen || phoneLandscape);
  }, [loop, hydrated, howToOpen, phoneLandscape]);
  useEffect(
    () => (touchLocked ? lockRunTouch(document) : undefined),
    [touchLocked]
  );
  useEffect(() => {
    requestTicket({ deviceId: getDevice().id });

    return loop.start();
  }, [loop, requestTicket]);

  return (
    // The page fills the dynamic viewport, so the address bar showing or
    // hiding resizes the card. The padding keeps it clear of notches, and the
    // top padding also clears the Sound, Vibration, Fullscreen and Theme row.
    <main className="flex h-dvh items-center justify-center overflow-hidden pt-[calc(max(1rem,env(safe-area-inset-top))+4rem)] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
      <h1 className="sr-only">Market Run</h1>
      {/* The card stays portrait and fills the space left inside the padding.
          Hidden, not removed, while the phone is sideways: the Run waits. */}
      <div className="@container-size flex size-full items-center justify-center">
        {phoneLandscape && <RotateNotice />}
        <div
          className="relative aspect-[3/4] w-[min(100cqw,75cqh)] overflow-hidden"
          hidden={phoneLandscape}
          style={{
            background: "var(--plop-paper)",
            border: "var(--plop-stroke) solid var(--plop-ink)",
            borderRadius: "var(--plop-radius-sticker)",
          }}
        >
          <ClientOnly>
            <Suspense>
              <MarketScene loop={loop} />
            </Suspense>
          </ClientOnly>
          <StallSigns />
          <FloatingJoystick onMove={handleJoystick} />
          <RunHud view={view} listRef={listRef} />
          {view.stage === "finished" && (
            <RunResults
              run={view.run}
              ticket={ticket}
              onPlayAgain={handlePlayAgain}
            />
          )}
          <div className="absolute top-14 right-2">
            <IconButton
              size="sm"
              icon={<InfoIcon />}
              label="How to play"
              onClick={() => {
                setReopened(true);
              }}
            />
          </div>
          {howToOpen && <HowTo onClose={handleCloseHowTo} />}
        </div>
      </div>
    </main>
  );
};

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "Market Run · Eddie@Bangmod" }] }),
  component: PlayPage,
});
