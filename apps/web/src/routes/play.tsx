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
  usePhonePortrait,
} from "@/components/play/rotate-notice";
import {
  RunCalls,
  Scoreboard,
  ShoppingListCard,
} from "@/components/play/run-hud";
import { RunResults } from "@/components/play/run-results";
import { StallSigns } from "@/components/play/stall-signs";
import { SettingsMenu } from "@/components/settings-menu";
import { getDevice, markHowToSeen, subscribeDevice } from "@/lib/device";
import { useRunFeedback } from "@/lib/feedback/use-run-feedback";
import { enterLandscape } from "@/lib/landscape";
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
  const phonePortrait = usePhonePortrait();

  // While the Run is live, every touch steers Eddie. It stays locked behind
  // the rotate notice, so a stray drag cannot pull-to-refresh the Run away.
  const touchLocked =
    (view.stage === "countdown" || view.stage === "running") && !howToOpen;

  const handleCloseHowTo = () => {
    markHowToSeen();
    setReopened(false);
  };

  const handleJoystick = input.setJoystick;
  const triedLandscape = useRef(false);

  const handlePlayAgain = () => {
    setSeed(newSeed());
  };

  useEffect(() => input.listen(window), [input]);
  // No time passes behind the how-to Sheet or the rotate notice.
  useEffect(() => {
    loop.setHeld(!hydrated || howToOpen || phonePortrait);
  }, [loop, hydrated, howToOpen, phonePortrait]);
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
    // hiding resizes the frame. The padding keeps it clear of notches.
    <main
      className="relative h-dvh overflow-hidden pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))]"
      onPointerDown={(event) => {
        // A phone's first tap goes fullscreen and sideways where it can.
        // Only the first: leaving fullscreen from Settings stays left.
        if (event.pointerType === "touch" && !triedLandscape.current) {
          triedLandscape.current = true;
          void enterLandscape();
        }
      }}
    >
      <h1 className="sr-only">Market Run</h1>
      {phonePortrait && (
        <div className="flex size-full items-center justify-center p-4">
          <RotateNotice />
        </div>
      )}
      {/* Hidden, not removed, while the phone is upright: the Run waits. */}
      <div
        className="@container-size relative size-full"
        hidden={phonePortrait}
      >
        {/* A thumb anywhere on the screen steers, rails included. */}
        <FloatingJoystick onMove={handleJoystick} />
        {/* Landscape: Shopping List | Market | Scoreboard. Portrait (a narrow
            window or a tablet held upright): Scoreboard, Market, List. */}
        <div className="pointer-events-none relative grid size-full grid-rows-[auto_minmax(0,1fr)_auto] gap-2 [--rail:clamp(8rem,16cqw,20rem)] landscape:grid-cols-[minmax(var(--rail),1fr)_min(calc(100cqw-2*var(--rail)-1rem),calc(100cqh*16/9))_minmax(var(--rail),1fr)] landscape:grid-rows-1 landscape:gap-2">
          <aside
            aria-label="Shopping List"
            className="order-3 mx-auto flex w-full max-w-xl items-center justify-center landscape:order-1 landscape:max-w-none"
          >
            {view.stage !== "finished" && (
              <ShoppingListCard
                list={view.run.shoppingList}
                listRef={listRef}
              />
            )}
          </aside>
          <div className="@container-size order-2 flex items-center justify-center">
            <div
              className="@container-size relative aspect-video w-[min(100cqw,calc(100cqh*16/9))] overflow-hidden"
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
              <RunCalls view={view} />
            </div>
          </div>
          <aside
            aria-label="Run status"
            className="order-1 flex items-center gap-2 landscape:order-3 landscape:flex-col"
          >
            <div className="pointer-events-auto flex gap-2 landscape:self-end">
              <IconButton
                size="sm"
                icon={<InfoIcon />}
                label="How to play"
                onClick={() => {
                  setReopened(true);
                }}
              />
              <SettingsMenu />
            </div>
            <div className="flex w-full flex-1 items-center justify-center">
              <Scoreboard run={view.run} />
            </div>
          </aside>
        </div>
        {view.stage === "finished" && (
          <RunResults
            run={view.run}
            ticket={ticket}
            onPlayAgain={handlePlayAgain}
          />
        )}
        {howToOpen && <HowTo onClose={handleCloseHowTo} />}
      </div>
    </main>
  );
};

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "Market Run · Eddie@Bangmod" }] }),
  component: PlayPage,
});
