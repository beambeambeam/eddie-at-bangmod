import {
  ButtonLink,
  Callout,
  IconButton,
  InfoIcon,
  Loader,
} from "@plop-ui/react";
import { useMutation } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { LanguageSwitch } from "@/components/language-switch";
import { FloatingJoystick } from "@/components/play/floating-joystick";
import { HazardWarnings } from "@/components/play/hazard-warnings";
import { HowTo } from "@/components/play/how-to";
import { loadMarketScene } from "@/components/play/load-market-scene";
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
import { RouterLink } from "@/components/router-link";
import { SettingsMenu } from "@/components/settings-menu";
import { getDevice, markHowToSeen, subscribeDevice } from "@/lib/device";
import { useRunFeedback } from "@/lib/feedback/use-run-feedback";
import { enterLandscape } from "@/lib/landscape";
import { useLanguage } from "@/lib/localization/language-provider";
import { lettered } from "@/lib/localization/lettering";
import { createMoveInput } from "@/lib/move-input";
import { createRunLoop } from "@/lib/run-loop";
import { lockRunTouch } from "@/lib/touch-lock";
import { useHydrated } from "@/lib/use-hydrated";
import { useRunSelect } from "@/lib/use-run-select";
import { orpc } from "@/utils/orpc";

// Three.js loads only on the client: the home page preloads it while idle.
const MarketScene = lazy(async () => {
  const module = await loadMarketScene();

  return { default: module.MarketScene };
});

const newSeed = () => Math.floor(Math.random() * 2 ** 32);

const UnsupportedBrowser = () => {
  const { text } = useLanguage();

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <h1 className="sr-only">{text.marketRun}</h1>
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <LanguageSwitch />
        <Callout
          action={
            <ButtonLink as={RouterLink} href="/" size="sm">
              {lettered(text.compatibility.home)}
            </ButtonLink>
          }
          className="w-full"
          headingLevel={2}
          role="alert"
          title={lettered(text.compatibility.title)}
          tone="warn"
        >
          {text.compatibility.description}
        </Callout>
      </div>
    </main>
  );
};

const PlayPage = () => {
  const { text } = useLanguage();
  const initialSeed = Route.useLoaderData();
  const input = useMemo(() => createMoveInput(), []);
  // Each "Play again" starts a fresh Run with a new seed.
  const [seed, setSeed] = useState(initialSeed);
  const loop = useMemo(() => createRunLoop(seed, input.read), [input, seed]);

  // The page re-renders only when the stage changes; each piece of the HUD
  // reads its own values from the loop.
  const stage = useRunSelect(loop, (view) => view.stage);

  // The Countdown waits until the Market is drawn and its shaders are
  // compiled, so no frame stalls once time runs. It stays ready across Runs.
  const [marketStatus, setMarketStatus] = useState<
    "loading" | "ready" | "unavailable"
  >("loading");

  const marketReady = marketStatus === "ready";

  const handleMarketReady = useCallback(() => {
    setMarketStatus("ready");
  }, []);

  const handleMarketUnavailable = useCallback(() => {
    setMarketStatus("unavailable");
  }, []);

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

  // The first-run how-to depends on the Device's settings.
  const hydrated = useHydrated();

  const seenHowTo = useSyncExternalStore(
    subscribeDevice,
    () => getDevice().seenHowTo,
    () => true
  );

  const [reopened, setReopened] = useState(false);
  const phonePortrait = usePhonePortrait();

  const howToOpen =
    hydrated && marketReady && !phonePortrait && (!seenHowTo || reopened);

  // While the Run is live, every touch steers Eddie. It stays locked behind
  // the rotate notice, so a stray drag cannot pull-to-refresh the Run away.
  const touchLocked =
    marketReady && (stage === "countdown" || stage === "running") && !howToOpen;

  const handleCloseHowTo = () => {
    markHowToSeen();
    setReopened(false);
  };

  const handleJoystick = input.setJoystick;
  const triedLandscape = useRef(false);

  const handlePlayAgain = () => {
    setSeed(newSeed());
  };

  useEffect(
    () => (marketReady ? input.listen(window) : undefined),
    [input, marketReady]
  );
  // No time passes while the Market loads, or behind the how-to Sheet or
  // the rotate notice.
  useEffect(() => {
    loop.setHeld(!hydrated || !marketReady || howToOpen || phonePortrait);
  }, [loop, hydrated, marketReady, howToOpen, phonePortrait]);
  useEffect(
    () => (touchLocked ? lockRunTouch(document) : undefined),
    [touchLocked]
  );
  useEffect(() => {
    if (marketReady) {
      requestTicket({ deviceId: getDevice().id });
    }

    return marketReady ? loop.start() : undefined;
  }, [loop, marketReady, requestTicket]);

  if (marketStatus === "unavailable") {
    return <UnsupportedBrowser />;
  }

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
      <h1 className="sr-only">{text.marketRun}</h1>
      {phonePortrait && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <RotateNotice />
        </div>
      )}
      {/* Keep the canvas measurable while upright so it can check WebGL. */}
      <div
        className="@container-size relative size-full"
        inert={phonePortrait}
        style={{ visibility: phonePortrait ? "hidden" : undefined }}
      >
        {/* A thumb anywhere on the screen steers, rails included. */}
        <FloatingJoystick onMove={handleJoystick} />
        {/* Landscape: Shopping List | Market | Scoreboard. Portrait (a narrow
            window or a tablet held upright): Scoreboard, Market, List. */}
        <div className="pointer-events-none relative grid size-full grid-rows-[auto_minmax(0,1fr)_auto] gap-2 [--rail:clamp(8rem,16cqw,20rem)] landscape:grid-cols-[minmax(var(--rail),1fr)_min(calc(100cqw-2*var(--rail)-1rem),calc(100cqh*16/9))_minmax(var(--rail),1fr)] landscape:grid-rows-1 landscape:gap-2">
          <aside
            aria-label={text.shoppingList}
            className="order-3 mx-auto flex w-full max-w-xl items-center justify-center landscape:order-1 landscape:max-w-none"
          >
            {stage !== "finished" && (
              <ShoppingListCard loop={loop} listRef={listRef} />
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
                  <MarketScene
                    loop={loop}
                    onReady={handleMarketReady}
                    onUnavailable={handleMarketUnavailable}
                  />
                </Suspense>
              </ClientOnly>
              <StallSigns />
              {marketReady ? (
                <>
                  <RunCalls loop={loop} />
                  <HazardWarnings loop={loop} />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <Loader
                    variant="card"
                    label={text.market.loading}
                    slowMessage={text.market.slowLoading}
                    tips={text.market.tips}
                    slowAfter={8000}
                  />
                </div>
              )}
            </div>
          </div>
          <aside
            aria-label={text.market.status}
            className="order-1 flex items-center gap-2 landscape:order-3 landscape:flex-col"
          >
            <div className="pointer-events-auto flex gap-2 landscape:self-end">
              <IconButton
                size="sm"
                icon={<InfoIcon />}
                label={text.howTo.title}
                onClick={() => {
                  setReopened(true);
                }}
              />
              {stage !== "finished" && <SettingsMenu />}
            </div>
            <div className="flex w-full flex-1 items-center justify-center">
              <Scoreboard loop={loop} />
            </div>
          </aside>
        </div>
        {stage === "finished" && (
          <RunResults
            run={loop.getSnapshot().run}
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
  // Share the first Shopping List between server rendering and hydration.
  loader: newSeed,
  component: PlayPage,
});
