import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { FloatingJoystick } from "@/components/play/floating-joystick";
import { RunHud } from "@/components/play/run-hud";
import { RunResults } from "@/components/play/run-results";
import { StallSigns } from "@/components/play/stall-signs";
import { createMoveInput } from "@/lib/move-input";
import { createRunLoop } from "@/lib/run-loop";

// Three.js loads only on the client, and only on this page.
const MarketScene = lazy(async () => {
  const module = await import("@/components/play/market-scene");

  return { default: module.MarketScene };
});

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

  const handleJoystick = input.setJoystick;

  const handlePlayAgain = () => {
    setSeed(newSeed());
  };

  useEffect(() => input.listen(window), [input]);
  useEffect(() => loop.start(), [loop]);

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <h1 className="sr-only">Market Run</h1>
      <div
        className="relative aspect-[3/4] w-[min(calc(100vw-2rem),calc((100svh-2rem)*0.75))] overflow-hidden"
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
        <RunHud view={view} />
        {view.stage === "finished" && (
          <RunResults run={view.run} onPlayAgain={handlePlayAgain} />
        )}
      </div>
    </main>
  );
};

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "Market Run · Eddie@Bangmod" }] }),
  component: PlayPage,
});
