import { memo } from "react";

const SKIN = "#c98d63";
const HAIR = "#1d1a1c";
const TIRE = "#1c1c20";
const STEEL = "#8a8f96";
const HEADLIGHT = "#fff1c9";

/** Shirt colors for the shoppers in a Crowd. */
const SHIRTS = ["#d95b43", "#4f7cac", "#e5b94f", "#7aa874", "#b46aa6"];

/** One shopper: a capsule body and a head, about Eddie's height. */
const Shopper = ({ x, z, shirt }: { x: number; z: number; shirt: string }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.55, 0]} castShadow>
      <capsuleGeometry args={[0.13, 0.6, 6, 12]} />
      <meshStandardMaterial color={shirt} roughness={0.8} />
    </mesh>
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

/**
 * Model slot `crowd`: a ring of shoppers on a pale disc that marks the slow
 * zone. `radius` is the zone's radius in Market units.
 */
const CrowdFigure = ({ radius }: { radius: number }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[radius, 32]} />
      <meshStandardMaterial
        color="#f4ecd8"
        transparent
        opacity={0.28}
        roughness={1}
      />
    </mesh>
    {SHIRTS.map((shirt, index) => {
      const angle = (index / SHIRTS.length) * Math.PI * 2;
      const spread = radius * (index % 2 === 0 ? 0.62 : 0.4);

      return (
        <Shopper
          key={shirt}
          x={Math.sin(angle) * spread}
          z={Math.cos(angle) * spread}
          shirt={shirt}
        />
      );
    })}
  </group>
);

export const CrowdModel = memo(CrowdFigure);

const Wheel = ({ z }: { z: number }) => (
  <mesh position={[0, 0.17, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
    <cylinderGeometry args={[0.17, 0.17, 0.09, 16]} />
    <meshStandardMaterial color={TIRE} roughness={0.9} />
  </mesh>
);

/**
 * Model slot `motorbike`: a scooter with a rider in a helmet and a lit
 * headlight. It faces +z and stands on y = 0.
 */
const MotorbikeFigure = () => (
  <group>
    <Wheel z={0.36} />
    <Wheel z={-0.36} />
    <mesh position={[0, 0.36, 0]} castShadow>
      <boxGeometry args={[0.26, 0.24, 0.78]} />
      <meshStandardMaterial color="#c8322b" roughness={0.4} metalness={0.3} />
    </mesh>
    <mesh position={[0, 0.52, -0.12]} castShadow>
      <boxGeometry args={[0.24, 0.08, 0.42]} />
      <meshStandardMaterial color={TIRE} roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.62, 0.34]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
      <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.5, 0.41]}>
      <sphereGeometry args={[0.06, 12, 8]} />
      <meshStandardMaterial
        color={HEADLIGHT}
        emissive={HEADLIGHT}
        emissiveIntensity={5}
        toneMapped={false}
      />
    </mesh>
    <mesh position={[0, 0.88, -0.08]} rotation={[0.25, 0, 0]} castShadow>
      <capsuleGeometry args={[0.14, 0.36, 6, 12]} />
      <meshStandardMaterial color="#3b6e8f" roughness={0.8} />
    </mesh>
    <mesh position={[0, 1.24, 0]} castShadow>
      <sphereGeometry args={[0.15, 16, 12]} />
      <meshStandardMaterial color="#f2c230" roughness={0.35} />
    </mesh>
  </group>
);

export const MotorbikeModel = memo(MotorbikeFigure);

const DOG_COAT = "#c99a5b";

/**
 * Model slot `soi-dog`: a tan street dog. It faces +z and stands on y = 0.
 * `chasing` raises its tail, so its pose shows the chase next to the HUD's
 * "Soi Dog!" label.
 */
const SoiDogFigure = ({ chasing }: { chasing: boolean }) => (
  <group>
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
      <meshStandardMaterial color="#7a5a35" roughness={0.8} />
    </mesh>
    {[-0.06, 0.06].map((x) => (
      <mesh key={x} position={[x, 0.55, 0.28]} castShadow>
        <coneGeometry args={[0.035, 0.09, 8]} />
        <meshStandardMaterial color="#7a5a35" roughness={0.8} />
      </mesh>
    ))}
    {[-0.07, 0.07].flatMap((x) =>
      [-0.15, 0.15].map((z) => (
        <mesh key={`${x}:${z}`} position={[x, 0.12, z]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.24, 8]} />
          <meshStandardMaterial color={DOG_COAT} roughness={0.85} />
        </mesh>
      ))
    )}
    <mesh
      position={[0, chasing ? 0.5 : 0.36, -0.3]}
      rotation={[chasing ? -0.6 : 0.7, 0, 0]}
      castShadow
    >
      <cylinderGeometry args={[0.025, 0.015, 0.22, 8]} />
      <meshStandardMaterial color={DOG_COAT} roughness={0.85} />
    </mesh>
  </group>
);

export const SoiDogModel = memo(SoiDogFigure);

const DASH = 0.5;
const DASH_GAP = 0.4;

/**
 * Model slot `motorbike-lane`: dashed edge lines across the Market along one
 * Motorbike lane, so players see where Motorbikes ride.
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
    <group>
      {[-0.45, 0.45].flatMap((edge) =>
        Array.from({ length: count }, (_, index) => (
          <mesh
            key={`${edge}:${index}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[
              from + DASH / 2 + index * (DASH + DASH_GAP),
              0.006,
              y + edge,
            ]}
          >
            <planeGeometry args={[DASH, 0.05]} />
            <meshStandardMaterial color="#f2c230" roughness={0.6} />
          </mesh>
        ))
      )}
    </group>
  );
};
