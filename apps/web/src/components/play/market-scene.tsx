import { EDDIE_SPEED, MARKET } from "@eddie-at-bangmod/game";
import type { Hazard, Vec2 } from "@eddie-at-bangmod/game";
import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MathUtils } from "three";
import type { Group } from "three";

import type { RunLoop } from "@/lib/run-loop";

import { createMarketCamera } from "./market-camera";
import { MarketGround } from "./models/market-ground";
import { MotorbikeLaneModel } from "./models/motorbike-lane-model";
import { StallModel } from "./models/stall-model";
import { readPlopPalette } from "./plop-colors";
import type { PlopPalette } from "./plop-colors";
import { eddieSlot } from "./sprites/slots";
import { Sprite } from "./sprites/sprite";
import { SpriteTexturesProvider } from "./sprites/sprite-textures";

/** The most device pixels per CSS pixel the canvas ever draws. */
const MAX_DPR = 2;

/** How high Eddie's step bounces, in Market units. */
const BOB = 0.06;

/** How fast his walk eases in and out, per second. */
const PACE_RATE = 10;

/** Distance covered by one step. */
const STRIDE = 0.45;

const EDDIE_HEIGHT = 1.5;
const MOTORBIKE_HEIGHT = 1.15;
const SOI_DOG_HEIGHT = 0.7;
const CROWD_HEIGHT = 1.2;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);

  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

/** True while the OS asks for reduced motion; follows changes live. */
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

/** The Run as of the latest snapshot. */
const useRun = (loop: RunLoop) =>
  useSyncExternalStore(loop.subscribe, loop.getSnapshot, loop.getSnapshot).run;

/**
 * Places Eddie at the latest snapshot and shows the sprite for his facing.
 * His step bobs with the distance he covers; with reduced motion he glides
 * flat.
 */
const Eddie = ({ loop, palette }: { loop: RunLoop; palette: PlopPalette }) => {
  const run = useRun(loop);

  const still = useReducedMotion();
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const pace = useRef(0);
  const phase = useRef(0);
  const last = useRef<Vec2 | null>(null);

  useFrame((_, delta) => {
    const group = root.current;

    if (!group || delta <= 0) {
      return;
    }

    const { position } = run.eddie;
    const from = last.current ?? position;
    const moved = Math.hypot(position.x - from.x, position.y - from.y);
    last.current = position;

    const target = still ? 0 : Math.min(moved / delta / EDDIE_SPEED, 1);
    pace.current = MathUtils.damp(pace.current, target, PACE_RATE, delta);
    phase.current += (moved / STRIDE) * Math.PI;

    group.position.set(position.x, 0, position.y);
    body.current?.position.set(
      0,
      Math.abs(Math.cos(phase.current)) * BOB * pace.current,
      0
    );
  });

  return (
    <group ref={root}>
      <Sprite
        slot={eddieSlot(run.eddie.facing)}
        height={EDDIE_HEIGHT}
        shadow={0.4}
        shadowColor={palette.ink}
        bodyRef={body}
      />
    </group>
  );
};

/** Which way a hazard's art is mirrored: art is drawn facing right. */
const facesLeft = (hazard: Hazard) => hazard.facing.x < 0;

const HazardFigure = ({
  hazard,
  palette,
}: {
  hazard: Hazard;
  palette: PlopPalette;
}) => {
  switch (hazard.kind) {
    case "crowd": {
      return (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <circleGeometry args={[hazard.radius, 32]} />
            <meshBasicMaterial
              color={palette.mustard}
              opacity={0.45}
              transparent
              depthWrite={false}
            />
          </mesh>
          <Sprite
            slot="crowd"
            height={CROWD_HEIGHT}
            shadow={hazard.radius * 0.9}
            shadowColor={palette.ink}
          />
        </>
      );
    }

    case "motorbike": {
      return (
        <Sprite
          slot="motorbike"
          height={MOTORBIKE_HEIGHT}
          shadow={0.5}
          shadowColor={palette.ink}
          flip={facesLeft(hazard)}
        />
      );
    }

    case "soi-dog": {
      return (
        <Sprite
          slot="soi-dog"
          height={SOI_DOG_HEIGHT}
          shadow={0.35}
          shadowColor={hazard.chasing ? palette.tomato : palette.ink}
          flip={facesLeft(hazard)}
        />
      );
    }

    default: {
      return null;
    }
  }
};

/** Draws every Hazard at the latest snapshot. */
const Hazards = ({
  loop,
  palette,
}: {
  loop: RunLoop;
  palette: PlopPalette;
}) => {
  const run = useRun(loop);

  return (
    <>
      {run.hazards.map((hazard) => (
        <group
          key={hazard.id}
          position={[hazard.position.x, 0, hazard.position.y]}
        >
          <HazardFigure hazard={hazard} palette={palette} />
        </group>
      ))}
    </>
  );
};

/** Marks each Motorbike lane from edge to edge of the Market. */
const MotorbikeLanes = ({ palette }: { palette: PlopPalette }) => (
  <>
    {MARKET.motorbikeLanes.map(({ y }) => (
      <MotorbikeLaneModel
        key={y}
        y={y}
        from={MARKET.bounds.minX - 1}
        to={MARKET.bounds.maxX + 1}
        color={palette.ink}
      />
    ))}
  </>
);

const Stalls = ({ palette }: { palette: PlopPalette }) => (
  <>
    {MARKET.stalls.map((stall) => (
      <StallModel key={stall.item} stall={stall} palette={palette} />
    ))}
  </>
);

const camera = createMarketCamera();

/**
 * The Market as a toon diorama of paper cutouts under the fixed camera. It
 * draws the snapshot only: no rules, and no text (every label is Plop UI over
 * the canvas, ADR-0003). There are no realtime shadows; each sprite has a
 * blob shadow. The pixel ratio stops at MAX_DPR and drops when frames run
 * slow.
 */
export const MarketScene = ({ loop }: { loop: RunLoop }) => {
  const palette = useMemo(() => readPlopPalette(), []);
  const [dprCap, setDprCap] = useState(MAX_DPR);

  const handleChange = ({ factor }: { factor: number }) => {
    setDprCap(Math.round(MathUtils.lerp(1, MAX_DPR, factor) * 10) / 10);
  };

  return (
    <Canvas
      camera={camera}
      dpr={[1, dprCap]}
      flat
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor onChange={handleChange} />
      <hemisphereLight args={[palette.paper, palette.periwinkle, 1.6]} />
      <directionalLight position={[-5, 10, 6]} intensity={1.6} />
      <Suspense>
        <SpriteTexturesProvider>
          <MarketGround palette={palette} />
          <MotorbikeLanes palette={palette} />
          <Stalls palette={palette} />
          <Hazards loop={loop} palette={palette} />
          <Eddie loop={loop} palette={palette} />
        </SpriteTexturesProvider>
      </Suspense>
    </Canvas>
  );
};
