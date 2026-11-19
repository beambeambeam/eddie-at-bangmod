import type { Stall } from "@eddie-at-bangmod/game";

import { AWNING_HEIGHT, AWNING_OFFSET } from "../stall-looks";
import { ProduceModel } from "./produce-model";

const WOOD = "#6b4a2f";
const WOOD_TOP = "#9a7148";
const CANVAS = "#f4ecd8";
const STEEL = "#8a8f96";
const BULB = "#ffcf87";

const COUNTER_HEIGHT = 0.72;
const STRIPES = 6;
const BULBS = 5;

const AWNING_TILT = 0.25;

/**
 * Model slot `stall`: a wooden counter with a cloth skirt, a steel tray of
 * produce, and a striped awning with warm bulbs. Centered on the Stall's
 * area, standing on y = 0, the front toward +z. `tint` colors cloth and awning.
 */
export const StallModel = ({ stall, tint }: { stall: Stall; tint: string }) => {
  const { area, item } = stall;
  const width = area.maxX - area.minX;
  const depth = area.maxY - area.minY;
  const awningDepth = depth * 0.8;
  const stripe = (width + 0.2) / STRIPES;
  const poleTop = AWNING_HEIGHT + 0.1;
  const poleX = width / 2 - 0.06;
  const poleZ = [-depth / 2 + 0.06, AWNING_OFFSET + awningDepth / 2 - 0.08];

  return (
    <group
      position={[(area.minX + area.maxX) / 2, 0, (area.minY + area.maxY) / 2]}
    >
      <mesh position={[0, COUNTER_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, COUNTER_HEIGHT, depth]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.4, depth / 2 + 0.012]} receiveShadow>
        <boxGeometry args={[width - 0.04, 0.56, 0.02]} />
        <meshStandardMaterial color={tint} roughness={0.95} />
      </mesh>
      <mesh position={[0, COUNTER_HEIGHT + 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.08, 0.06, depth + 0.08]} />
        <meshStandardMaterial color={WOOD_TOP} roughness={0.6} />
      </mesh>
      <mesh position={[0, COUNTER_HEIGHT + 0.08, 0.05]} receiveShadow>
        <boxGeometry args={[width - 0.2, 0.04, depth - 0.3]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
      </mesh>
      <group position={[0, COUNTER_HEIGHT + 0.1, 0.05]}>
        <ProduceModel item={item} width={width - 0.36} depth={depth - 0.44} />
      </group>
      {poleZ.flatMap((z) =>
        [-poleX, poleX].map((x) => (
          <mesh
            key={`${x}:${z}`}
            position={[x, (COUNTER_HEIGHT + poleTop) / 2, z]}
            castShadow
          >
            <cylinderGeometry
              args={[0.025, 0.025, poleTop - COUNTER_HEIGHT, 8]}
            />
            <meshStandardMaterial
              color={STEEL}
              metalness={0.8}
              roughness={0.35}
            />
          </mesh>
        ))
      )}
      <group
        position={[0, AWNING_HEIGHT, AWNING_OFFSET]}
        rotation={[AWNING_TILT, 0, 0]}
      >
        {Array.from({ length: STRIPES }, (_, index) => (
          <mesh
            key={index}
            position={[(index + 0.5) * stripe - (width + 0.2) / 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[stripe, 0.04, awningDepth]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? tint : CANVAS}
              roughness={0.9}
            />
          </mesh>
        ))}
        <mesh position={[0, -0.07, awningDepth / 2]} castShadow>
          <boxGeometry args={[width + 0.2, 0.14, 0.02]} />
          <meshStandardMaterial color={tint} roughness={0.9} />
        </mesh>
        {Array.from({ length: BULBS }, (_, index) => (
          <mesh
            key={index}
            position={[
              ((index + 0.5) / BULBS - 0.5) * width,
              -0.18,
              awningDepth / 2 + 0.02,
            ]}
          >
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial
              color={BULB}
              emissive={BULB}
              emissiveIntensity={6}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      <pointLight
        position={[0, AWNING_HEIGHT - 0.25, depth / 2]}
        color={BULB}
        intensity={7}
        distance={3}
        decay={2}
      />
    </group>
  );
};
