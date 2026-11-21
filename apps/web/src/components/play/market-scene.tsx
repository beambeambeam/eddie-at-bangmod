import { EDDIE_SPEED, MARKET } from "@eddie-at-bangmod/game";
import type { Hazard, Vec2 } from "@eddie-at-bangmod/game";
import {
  Environment,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { GLProps } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA as Smaa,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import {
  Component,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { MathUtils, Mesh, WebGLRenderer } from "three";
import type { Group } from "three";

import type { RunLoop } from "@/lib/run-loop";
import { useRunSelect } from "@/lib/use-run-select";

import { FlatMarket } from "./flat-market";
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
import { useReducedMotion } from "./motion";
import { STALL_LOOKS } from "./stall-looks";
import { StallSigns } from "./stall-signs";

/** The most device pixels per CSS pixel the canvas ever draws. */
const MAX_DPR = 2;

/** The cap on phones and tablets, whose screens pack far more pixels. */
const MAX_TOUCH_DPR = 1.5;

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

/**
 * Places Eddie at the latest snapshot, turns him toward his facing and drives
 * his walk from the distance he covers. With reduced motion he turns at once
 * and glides without a walk cycle; this follows OS changes live. It reads the
 * snapshot each frame, so ticks never re-render React.
 */
const Eddie = ({ loop }: { loop: RunLoop }) => {
  const still = useReducedMotion();
  const root = useRef<Group>(null);
  const gait = useRef<Gait>({ phase: 0, pace: 0 });
  const last = useRef<Vec2 | null>(null);

  useFrame((_, delta) => {
    const group = root.current;

    if (!group || delta <= 0) {
      return;
    }

    const { position, facing } = loop.getSnapshot().run.eddie;
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

const yawOf = ({ facing }: Hazard) => Math.atan2(facing.x, facing.y);

/** What the figure of a Hazard depends on. Its place changes every tick. */
const castKey = (hazard: Hazard) =>
  `${hazard.id}:${hazard.kind}:${hazard.radius}:${
    hazard.kind === "soi-dog" && hazard.chasing
  }`;

/** Moves one Hazard's figure to its place in the latest snapshot, each frame. */
const HazardPlace = ({
  loop,
  hazard,
  children,
}: {
  loop: RunLoop;
  hazard: Hazard;
  children: ReactNode;
}) => {
  const root = useRef<Group>(null);

  useFrame(() => {
    const group = root.current;

    const now = loop
      .getSnapshot()
      .run.hazards.find(({ id }) => id === hazard.id);

    if (group && now) {
      group.position.set(now.position.x, 0, now.position.y);
      group.rotation.y = yawOf(now);
    }
  });

  return (
    <group
      ref={root}
      position={[hazard.position.x, 0, hazard.position.y]}
      rotation-y={yawOf(hazard)}
    >
      {children}
    </group>
  );
};

/**
 * Draws every Hazard at the latest snapshot, turned toward its facing. React
 * re-renders only when a Hazard comes, goes or changes its figure; movement
 * happens frame by frame.
 */
const Hazards = ({ loop }: { loop: RunLoop }) => {
  // Subscribes to the cast only: the figures re-render when it changes.
  useRunSelect(loop, ({ run }) => run.hazards.map(castKey).join("|"));

  return (
    <>
      {loop.getSnapshot().run.hazards.map((hazard) => (
        <HazardPlace key={hazard.id} loop={loop} hazard={hazard}>
          <HazardFigure hazard={hazard} />
        </HazardPlace>
      ))}
    </>
  );
};

/** Frames drawn after compiling, so shadow and post passes build theirs too. */
const WARM_FRAMES = 3;

/**
 * Gets the GPU ready before the Countdown. It builds one of every Hazard
 * figure under the ground, out of sight, then compiles every shader in the
 * scene and draws a few frames. A Hazard that first appears mid-Run then
 * reuses those shaders instead of stalling the frame while they compile.
 * The copies stay hidden rather than unmounted, so their shaders stay alive.
 */
const WarmUp = ({ onReady }: { onReady: () => void }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const sceneCamera = useThree((state) => state.camera);
  const [warm, setWarm] = useState(false);
  // Frames seen before compiling; then frames left to draw after it.
  const frames = useRef(0);
  const compiled = useRef<boolean | null>(null);

  useFrame(() => {
    if (warm) {
      return;
    }

    frames.current += 1;

    // The first frame lets the Environment set the scene's lighting, which
    // every shader depends on.
    if (compiled.current === null && frames.current > 1) {
      compiled.current = false;
      void (async () => {
        await gl.compileAsync(scene, sceneCamera);
        compiled.current = true;
        frames.current = 0;
      })();
    }

    if (compiled.current === true && frames.current >= WARM_FRAMES) {
      setWarm(true);
      onReady();
    }
  });

  return (
    <group position={[0, -4, 0]} visible={!warm}>
      <MotorbikeModel />
      <SoiDogModel chasing />
      <CrowdModel radius={1} />
    </group>
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
      {tones.map(({ stall, tone }, index) => (
        <StallModel key={stall.item} stall={stall} index={index} tint={tone} />
      ))}
    </>
  );
};

/**
 * Dusk light: a low warm sun, a cool sky, and warm shophouse glow for
 * reflections. The light setup draws a smaller shadow map.
 */
const Lighting = ({ rich }: { rich: boolean }) => {
  const mapSize = rich ? 1024 : 512;

  return (
    <>
      <color attach="background" args={["#1b1d2a"]} />
      <hemisphereLight args={["#8296d0", "#3a2a22", 0.7]} />
      <directionalLight
        // Three keeps a shadow map at its first size, so a new size needs a
        // new light.
        key={mapSize}
        position={[-6, 10, 5]}
        color="#ffbb85"
        intensity={2.4}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
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
};

/**
 * Turns shadow casting off for the static Market on the light setup. Only
 * Eddie and the Hazards cast then, so the shadow pass draws a few dozen
 * meshes instead of hundreds. Each mesh keeps its own choice for the rich
 * setup.
 */
const StaticCasters = ({
  cast,
  children,
}: {
  cast: boolean;
  children: ReactNode;
}) => {
  const root = useRef<Group>(null);

  useLayoutEffect(() => {
    root.current?.traverse((object) => {
      if (object instanceof Mesh) {
        object.userData.castsShadow ??= object.castShadow;
        object.castShadow = cast && object.userData.castsShadow === true;
      }
    });
  }, [cast]);

  return <group ref={root}>{children}</group>;
};

const camera = createMarketCamera();

const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

const WEBGL_UNAVAILABLE = new Error("WebGL 2 is unavailable.");

const createRenderer: GLProps = ({ canvas }) => {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new TypeError("The Market requires an HTML canvas.");
  }

  // A driver can reject the preferred configuration while supporting WebGL 2
  // with default power and no multisampling. Reuse the context on this canvas.
  const context =
    canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    }) ?? canvas.getContext("webgl2");

  if (!context) {
    throw WEBGL_UNAVAILABLE;
  }

  return new WebGLRenderer({
    antialias: context.getContextAttributes()?.antialias,
    canvas,
    context,
  });
};

interface MarketRendererBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

// Canvas forwards renderer initialization errors to the nearest React boundary.
class MarketRendererBoundary extends Component<
  MarketRendererBoundaryProps,
  { unavailable: boolean }
> {
  constructor(props: MarketRendererBoundaryProps) {
    super(props);
    this.state = { unavailable: false };
  }

  static getDerivedStateFromError(error: Error) {
    if (error !== WEBGL_UNAVAILABLE) {
      throw error;
    }

    return { unavailable: true };
  }

  render(): ReactNode {
    return this.state.unavailable ? this.props.fallback : this.props.children;
  }
}

/**
 * The Market as a lit 3D diorama under the fixed camera. It draws the
 * snapshot only: no rules, and no text (every label is Plop UI over the
 * canvas, ADR-0003).
 *
 * Two setups keep it smooth on phones. Rich adds wet-ground reflections, AO,
 * bloom and a vignette in a post pass. Light skips the post pass, uses the
 * canvas's own MSAA, a smaller shadow map, and only Eddie and the Hazards
 * cast shadows. Touch devices start light; any device drops to light when
 * frames run slow. The pixel ratio stops at MAX_DPR (MAX_TOUCH_DPR on touch)
 * and follows the frame rate.
 *
 * `onReady` fires once every shader is compiled and the first frames are
 * drawn, so the Countdown can start on a smooth frame.
 */
const MarketSceneView = ({
  loop,
  onReady,
}: {
  loop: RunLoop;
  onReady: () => void;
}) => {
  const touch = useMemo(() => isTouch(), []);
  const [rich, setRich] = useState(!touch);
  const maxDpr = touch ? MAX_TOUCH_DPR : MAX_DPR;
  const [dprCap, setDprCap] = useState(touch ? 1.25 : 1.5);

  const handleChange = ({ factor }: { factor: number }) => {
    setDprCap(Math.round(MathUtils.lerp(1, maxDpr, factor) * 10) / 10);
  };

  const handleDecline = () => {
    setRich(false);
  };

  return (
    <Canvas
      camera={camera}
      dpr={[1, dprCap]}
      shadows="percentage"
      gl={createRenderer}
    >
      <PerformanceMonitor onChange={handleChange} onDecline={handleDecline} />
      <Lighting rich={rich} />
      <StaticCasters cast={rich}>
        <MarketGround wet={rich} />
        <MotorbikeLanes />
        <Stalls />
      </StaticCasters>
      <WarmUp onReady={onReady} />
      <Hazards loop={loop} />
      <Eddie loop={loop} />
      {rich ? (
        <EffectComposer multisampling={0}>
          <N8AO
            halfRes
            quality="performance"
            aoRadius={0.8}
            distanceFalloff={0.6}
            intensity={2.5}
          />
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.3} darkness={0.55} />
          <Smaa />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
};

const MarketSceneWithFallback = (props: {
  loop: RunLoop;
  onReady: () => void;
}) => (
  <MarketRendererBoundary fallback={<FlatMarket {...props} />}>
    <MarketSceneView {...props} />
    <StallSigns />
  </MarketRendererBoundary>
);

export const MarketScene = memo(MarketSceneWithFallback);
