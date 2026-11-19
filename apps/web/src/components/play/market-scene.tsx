import { EDDIE_SPEED, MARKET } from "@eddie-at-bangmod/game";
import type { Hazard, Vec2 } from "@eddie-at-bangmod/game";
import {
  Environment,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA as Smaa,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MathUtils } from "three";
import type { Group } from "three";

import type { RunLoop } from "@/lib/run-loop";

import { createMarketCamera } from "./market-camera";
import { EddieModel } from "./models/eddie-model";
import type { Gait } from "./models/eddie-model";
import {
  CrowdModel,
  MotorbikeLaneModel,
  MotorbikeModel,
  SoiDogModel,
} from "./models/hazard-models";
import { MarketGround } from "./models/market-ground";
import { StallModel } from "./models/stall-model";
import { STALL_LOOKS } from "./stall-looks";

/** How fast Eddie turns toward his facing, per second. */
const TURN_RATE = 14;

/** How fast his walk eases in and out, per second. */
const PACE_RATE = 10;

/** Distance covered by one step. */
const STRIDE = 0.45;

/** Reads a Plop spot color, so awnings match the Plop Stall signs. */
const plopColor = (token: string) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--plop-${token}`)
    .trim();

/** The shortest signed angle from `from` to `to`. */
const turnBetween = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Places Eddie at the latest snapshot, turns him toward his facing and drives
 * his walk from the distance he covers. With reduced motion he turns at once
 * and glides without a walk cycle.
 */
const Eddie = ({ loop }: { loop: RunLoop }) => {
  const { run } = useSyncExternalStore(
    loop.subscribe,
    loop.getSnapshot,
    loop.getSnapshot
  );

  const still = useMemo(() => prefersReducedMotion(), []);
  const root = useRef<Group>(null);
  const gait = useRef<Gait>({ phase: 0, pace: 0 });
  const last = useRef<Vec2 | null>(null);

  useFrame((_, delta) => {
    const group = root.current;

    if (!group || delta <= 0) {
      return;
    }

    const { position, facing } = run.eddie;
    const from = last.current ?? position;
    const moved = Math.hypot(position.x - from.x, position.y - from.y);
    last.current = position;

    const pace = still ? 0 : Math.min(moved / delta / EDDIE_SPEED, 1);
    gait.current.pace = MathUtils.damp(
      gait.current.pace,
      pace,
      PACE_RATE,
      delta
    );
    gait.current.phase += (moved / STRIDE) * Math.PI;

    const yaw = Math.atan2(facing.x, facing.y);
    const turn = turnBetween(group.rotation.y, yaw);
    group.rotation.y += still
      ? turn
      : turn * (1 - Math.exp(-TURN_RATE * delta));
    group.position.set(position.x, 0, position.y);
  });

  return (
    <group ref={root}>
      <EddieModel gait={gait} />
    </group>
  );
};

const HazardFigure = ({ hazard }: { hazard: Hazard }) => {
  switch (hazard.kind) {
    case "crowd": {
      return <CrowdModel radius={hazard.radius} />;
    }

    case "motorbike": {
      return <MotorbikeModel />;
    }

    case "soi-dog": {
      return <SoiDogModel chasing={hazard.chasing} />;
    }

    default: {
      return null;
    }
  }
};

/** Draws every Hazard at the latest snapshot, turned toward its facing. */
const Hazards = ({ loop }: { loop: RunLoop }) => {
  const { run } = useSyncExternalStore(
    loop.subscribe,
    loop.getSnapshot,
    loop.getSnapshot
  );

  return (
    <>
      {run.hazards.map((hazard) => (
        <group
          key={hazard.id}
          position={[hazard.position.x, 0, hazard.position.y]}
          rotation-y={Math.atan2(hazard.facing.x, hazard.facing.y)}
        >
          <HazardFigure hazard={hazard} />
        </group>
      ))}
    </>
  );
};

/** Marks each Motorbike lane from edge to edge of the Market. */
const MotorbikeLanes = () => (
  <>
    {MARKET.motorbikeLanes.map(({ y }) => (
      <MotorbikeLaneModel
        key={y}
        y={y}
        from={MARKET.bounds.minX - 1}
        to={MARKET.bounds.maxX + 1}
      />
    ))}
  </>
);

const Stalls = () => {
  const tones = useMemo(
    () =>
      MARKET.stalls.map((stall) => ({
        stall,
        tone: plopColor(STALL_LOOKS[stall.item].tone),
      })),
    []
  );

  return (
    <>
      {tones.map(({ stall, tone }) => (
        <StallModel key={stall.item} stall={stall} tint={tone} />
      ))}
    </>
  );
};

/** Dusk light: a low warm sun, a cool sky, and warm shophouse glow for reflections. */
const Lighting = () => (
  <>
    <color attach="background" args={["#1b1d2a"]} />
    <hemisphereLight args={["#8296d0", "#3a2a22", 0.7]} />
    <directionalLight
      position={[-6, 10, 5]}
      color="#ffbb85"
      intensity={2.4}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-camera-left={-9}
      shadow-camera-right={9}
      shadow-camera-top={9}
      shadow-camera-bottom={-9}
      shadow-camera-near={1}
      shadow-camera-far={30}
    />
    <Environment frames={1} resolution={256}>
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#a9b8ff"
        position={[0, 8, 0]}
        rotation-x={Math.PI / 2}
        scale={[20, 20, 1]}
      />
      <Lightformer
        form="rect"
        intensity={3}
        color="#ffae6b"
        position={[-10, 2, 0]}
        rotation-y={Math.PI / 2}
        scale={[20, 4, 1]}
      />
      <Lightformer
        form="ring"
        intensity={4}
        color="#ffd28a"
        position={[4, 4, 6]}
        scale={2}
        target={[0, 0, 0]}
      />
    </Environment>
  </>
);

const camera = createMarketCamera();

/**
 * The Market as a lit 3D diorama under the fixed camera. It draws the
 * snapshot only: no rules, and no text (every label is Plop UI over the
 * canvas, ADR-0003). Weak devices drop reflections, AO and bloom.
 */
export const MarketScene = ({ loop }: { loop: RunLoop }) => {
  const [rich, setRich] = useState(true);

  const handleDecline = () => {
    setRich(false);
  };

  return (
    <Canvas
      camera={camera}
      dpr={[1, 1.5]}
      shadows="soft"
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor onDecline={handleDecline} />
      <Lighting />
      <MarketGround wet={rich} />
      <MotorbikeLanes />
      <Stalls />
      <Hazards loop={loop} />
      <Eddie loop={loop} />
      <EffectComposer multisampling={0}>
        <N8AO
          enabled={rich}
          halfRes
          quality="performance"
          aoRadius={0.8}
          distanceFalloff={0.6}
          intensity={2.5}
        />
        <Bloom mipmapBlur luminanceThreshold={1} intensity={rich ? 0.9 : 0} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.3} darkness={0.55} />
        <Smaa />
      </EffectComposer>
    </Canvas>
  );
};
