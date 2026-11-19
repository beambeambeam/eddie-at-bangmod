import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import type { Ref } from "react";
import type { Group } from "three";

import { useReducedMotion, useTravel } from "../motion";

const SKIN = "#c98d63";
const HAIR = "#1d1a1c";
const TIRE = "#1c1c20";
const STEEL = "#8a8f96";
const HEADLIGHT = "#fff1c9";
const TAIL_LIGHT = "#ff3b2f";

/** The shoppers in a Crowd: shirt, height and whether they carry a bag. */
const SHOPPERS = [
  { shirt: "#d95b43", height: 1, bag: "#f4ecd8" },
  { shirt: "#4f7cac", height: 1.08, bag: null },
  { shirt: "#e5b94f", height: 0.9, bag: "#e05a7a" },
  { shirt: "#7aa874", height: 1.04, bag: null },
  { shirt: "#b46aa6", height: 0.95, bag: "#4fa3d1" },
  { shirt: "#f1efe8", height: 0.82, bag: null },
] as const;

/** One shopper: a capsule body, arms and a head, about Eddie's height. */
const Shopper = ({
  x,
  z,
  shirt,
  height,
  bag,
  facing,
}: {
  x: number;
  z: number;
  shirt: string;
  height: number;
  bag: string | null;
  facing: number;
}) => (
  <group position={[x, 0, z]} rotation-y={facing} scale={height}>
    <mesh position={[0, 0.55, 0]} castShadow>
      <capsuleGeometry args={[0.13, 0.6, 6, 12]} />
      <meshStandardMaterial color={shirt} roughness={0.8} />
    </mesh>
    {[-1, 1].map((side) => (
      <mesh
        key={side}
        position={[side * 0.17, 0.68, 0]}
        rotation-z={side * 0.12}
        castShadow
      >
        <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>
    ))}
    {bag === null ? null : (
      <mesh position={[0.22, 0.4, 0]} castShadow>
        <boxGeometry args={[0.14, 0.18, 0.1]} />
        <meshStandardMaterial color={bag} roughness={0.7} />
      </mesh>
    )}
    <mesh position={[0, 1.12, 0]} castShadow>
      <sphereGeometry args={[0.13, 16, 12]} />
      <meshStandardMaterial color={SKIN} roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.18, -0.02]} castShadow>
      <sphereGeometry args={[0.135, 16, 8, 0, Math.PI * 2, 0, 1.4]} />
      <meshStandardMaterial color={HAIR} roughness={0.9} />
    </mesh>
  </group>
);

/** How fast the Crowd sways, per second. */
const SWAY_RATE = 0.8;

/**
 * Model slot `crowd`: a loose ring of mixed shoppers on a pale disc that
 * marks the slow zone. `radius` is the zone's radius in Market units. The
 * ring sways gently; with reduced motion it stands still.
 */
const CrowdFigure = ({ radius }: { radius: number }) => {
  const still = useReducedMotion();
  const ring = useRef<Group>(null);

  useFrame(({ clock }) => {
    const group = ring.current;

    if (!group) {
      return;
    }

    for (const [index, shopper] of group.children.entries()) {
      const sway = still
        ? 0
        : Math.sin(clock.elapsedTime * SWAY_RATE * Math.PI * 2 + index * 1.3);

      shopper.rotation.z = sway * 0.04;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial
          color="#f4ecd8"
          transparent
          opacity={0.28}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
      <group ref={ring}>
        {SHOPPERS.map(({ shirt, height, bag }, index) => {
          const angle = (index / SHOPPERS.length) * Math.PI * 2;
          const spread = radius * (index % 2 === 0 ? 0.62 : 0.38);

          return (
            <Shopper
              key={shirt}
              x={Math.sin(angle) * spread}
              z={Math.cos(angle) * spread}
              shirt={shirt}
              height={height}
              bag={bag}
              facing={angle + Math.PI}
            />
          );
        })}
      </group>
    </group>
  );
};

export const CrowdModel = memo(CrowdFigure);

const WHEEL_RADIUS = 0.17;

const Wheel = ({ wheel, z }: { wheel: Ref<Group>; z: number }) => (
  <group ref={wheel} position={[0, WHEEL_RADIUS, z]}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.09, 16]} />
      <meshStandardMaterial color={TIRE} roughness={0.9} />
    </mesh>
    {[0, Math.PI / 2].map((angle) => (
      <mesh key={angle} rotation-x={angle}>
        <boxGeometry args={[0.1, 0.2, 0.025]} />
        <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
      </mesh>
    ))}
  </group>
);

/**
 * Model slot `motorbike`: a scooter with a rider in a helmet, hands on the
 * bars, a lit headlight and tail light. It faces +z and stands on y = 0. The
 * wheels roll with the distance it covers.
 */
const MotorbikeFigure = () => {
  const root = useRef<Group>(null);
  const front = useRef<Group>(null);
  const back = useRef<Group>(null);

  useTravel(root, (distance) => {
    const roll = distance / WHEEL_RADIUS;

    if (front.current) {
      front.current.rotation.x += roll;
    }

    if (back.current) {
      back.current.rotation.x += roll;
    }
  });

  return (
    <group ref={root}>
      <Wheel wheel={front} z={0.36} />
      <Wheel wheel={back} z={-0.36} />
      <mesh position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[0.26, 0.24, 0.78]} />
        <meshStandardMaterial color="#c8322b" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.5, 0.33]} rotation-x={-0.3} castShadow>
        <boxGeometry args={[0.3, 0.42, 0.08]} />
        <meshStandardMaterial color="#c8322b" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.52, -0.12]} castShadow>
        <boxGeometry args={[0.24, 0.08, 0.42]} />
        <meshStandardMaterial color={TIRE} roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 0.22, -0.3]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.72, 0.36]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 0.42]}>
        <sphereGeometry args={[0.06, 12, 8]} />
        <meshStandardMaterial
          color={HEADLIGHT}
          emissive={HEADLIGHT}
          emissiveIntensity={5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.46, -0.4]}>
        <boxGeometry args={[0.12, 0.05, 0.02]} />
        <meshStandardMaterial
          color={TAIL_LIGHT}
          emissive={TAIL_LIGHT}
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.12, 0.5, 0.02]}
            rotation-x={-1.2}
            castShadow
          >
            <capsuleGeometry args={[0.06, 0.26, 4, 8]} />
            <meshStandardMaterial color="#2a3346" roughness={0.85} />
          </mesh>
          <mesh
            position={[side * 0.18, 0.86, 0.18]}
            rotation={[-1, 0, side * 0.2]}
            castShadow
          >
            <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
            <meshStandardMaterial color="#3b6e8f" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.88, -0.08]} rotation={[0.25, 0, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.36, 6, 12]} />
        <meshStandardMaterial color="#3b6e8f" roughness={0.8} />
      </mesh>
      <group position={[0, 1.24, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#f2c230" roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.01, 0.06]} rotation-x={0.2}>
          <sphereGeometry args={[0.14, 16, 8, -1, 2, 1.2, 0.6]} />
          <meshStandardMaterial
            color="#1d2430"
            metalness={0.5}
            roughness={0.15}
          />
        </mesh>
      </group>
    </group>
  );
};

export const MotorbikeModel = memo(MotorbikeFigure);

const DOG_COAT = "#c99a5b";
const DOG_DARK = "#7a5a35";

/** How far a soi dog moves per trot cycle. */
const DOG_STRIDE = 0.35;

/** Diagonal leg pairs swing together: front-left with back-right. */
const TROT_SIGNS = [1, -1, -1, 1];

/** Tail tilt: raised while chasing, drooping otherwise. */
const TAIL_TILT = { resting: -2.2, chasing: -0.5 };

/** Tail wags per second: lazy while it naps, fast while it chases. */
const WAG_RATE = { resting: 1.2, chasing: 5 };

/**
 * Model slot `soi-dog`: a tan street dog. It faces +z and stands on y = 0.
 * Its legs trot with the distance it covers. `chasing` raises and wags its
 * tail fast, so its pose shows the chase next to the HUD's "Soi Dog!" label.
 * With reduced motion the legs and tail hold still.
 */
const SoiDogFigure = ({ chasing }: { chasing: boolean }) => {
  const still = useReducedMotion();
  const root = useRef<Group>(null);
  const legs = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const phase = useRef(0);
  const wag = useRef(0);

  useTravel(root, (distance, delta) => {
    phase.current += (distance / DOG_STRIDE) * Math.PI * 2;
    wag.current +=
      delta * Math.PI * 2 * (chasing ? WAG_RATE.chasing : WAG_RATE.resting);

    const pace = delta > 0 ? Math.min(distance / delta, 1) : 0;
    const trot = still ? 0 : Math.sin(phase.current) * pace;

    for (const [index, leg] of (legs.current?.children ?? []).entries()) {
      leg.rotation.x = trot * 0.6 * (TROT_SIGNS[index] ?? 0);
    }

    // YXZ: tilt the tail first, then wag it side to side around the body.
    tail.current?.rotation.set(
      chasing ? TAIL_TILT.chasing : TAIL_TILT.resting,
      still ? 0 : Math.sin(wag.current) * 0.5,
      0,
      "YXZ"
    );
  });

  return (
    <group ref={root}>
      <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.34, 6, 12]} />
        <meshStandardMaterial color={DOG_COAT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.44, 0.3]} castShadow>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshStandardMaterial color={DOG_COAT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.41, 0.41]} castShadow>
        <boxGeometry args={[0.08, 0.07, 0.1]} />
        <meshStandardMaterial color={DOG_DARK} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.43, 0.465]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshStandardMaterial color={HAIR} roughness={0.3} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.28]} castShadow>
          <coneGeometry args={[0.035, 0.09, 8]} />
          <meshStandardMaterial color={DOG_DARK} roughness={0.8} />
        </mesh>
      ))}
      <group ref={legs}>
        {[0.15, -0.15].flatMap((z) =>
          [-0.07, 0.07].map((x) => (
            <group key={`${x}:${z}`} position={[x, 0.24, z]}>
              <mesh position={[0, -0.12, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.24, 8]} />
                <meshStandardMaterial color={DOG_COAT} roughness={0.85} />
              </mesh>
            </group>
          ))
        )}
      </group>
      <group ref={tail} position={[0, 0.38, -0.24]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.015, 0.22, 8]} />
          <meshStandardMaterial color={DOG_COAT} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
};

export const SoiDogModel = memo(SoiDogFigure);

const DASH = 0.5;
const DASH_GAP = 0.4;

/**
 * Model slot `motorbike-lane`: dashed edge lines across the Market along one
 * Motorbike lane, so players see where Motorbikes ride. Every dash is one
 * instance of a single mesh.
 */
export const MotorbikeLaneModel = ({
  y,
  from,
  to,
}: {
  y: number;
  from: number;
  to: number;
}) => {
  const count = Math.floor((to - from) / (DASH + DASH_GAP));

  return (
    <Instances limit={count * 2} receiveShadow>
      <planeGeometry args={[DASH, 0.05]} />
      <meshStandardMaterial color="#f2c230" roughness={0.6} />
      {[-0.45, 0.45].flatMap((edge) =>
        Array.from({ length: count }, (_, index) => (
          <Instance
            key={`${edge}:${index}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[
              from + DASH / 2 + index * (DASH + DASH_GAP),
              0.006,
              y + edge,
            ]}
          />
        ))
      )}
    </Instances>
  );
};
