import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import type { RefObject } from "react";
import type { Group } from "three";

/** How Eddie's legs and arms should move this frame. */
export interface Gait {
  /** Walk cycle angle in radians. One full turn is two steps. */
  phase: number;
  /** 0 when Eddie stands still, 1 at full walking speed. */
  pace: number;
}

const SKIN = "#c98d63";
const HAIR = "#1d1a1c";
const SHIRT = "#f3f1ea";
const TROUSERS = "#232a3d";
const SHOES = "#2d2522";
const BACKPACK = "#e0662c";

const LEG_SWING = 0.7;
const ARM_SWING = 0.55;
const BOB = 0.035;

const Limb = ({
  limb,
  x,
  y,
  length,
  radius,
  color,
  end,
}: {
  limb: RefObject<Group | null>;
  x: number;
  y: number;
  length: number;
  radius: number;
  color: string;
  end: { color: string; size: [number, number, number]; z: number };
}) => (
  <group ref={limb} position={[x, y, 0]}>
    <mesh position={[0, -length / 2 - radius, 0]} castShadow>
      <capsuleGeometry args={[radius, length, 6, 12]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
    <mesh position={[0, -length - radius * 2, end.z]} castShadow>
      <boxGeometry args={end.size} />
      <meshStandardMaterial color={end.color} roughness={0.6} />
    </mesh>
  </group>
);

/**
 * Model slot `eddie`: a student in a white uniform shirt with a backpack,
 * built from primitives. It faces +z and stands on y = 0. A GLB can replace
 * it later; it only has to read the same Gait.
 */
const EddieFigure = ({ gait }: { gait: RefObject<Gait> }) => {
  const body = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);

  useFrame(() => {
    const { phase, pace } = gait.current;
    const swing = Math.sin(phase) * pace;

    leftLeg.current?.rotation.set(swing * LEG_SWING, 0, 0);
    rightLeg.current?.rotation.set(-swing * LEG_SWING, 0, 0);
    leftArm.current?.rotation.set(-swing * ARM_SWING, 0, 0.08);
    rightArm.current?.rotation.set(swing * ARM_SWING, 0, -0.08);
    body.current?.position.set(0, Math.abs(Math.cos(phase)) * BOB * pace, 0);
  });

  return (
    <group ref={body}>
      <Limb
        limb={leftLeg}
        x={-0.1}
        y={0.66}
        length={0.42}
        radius={0.085}
        color={TROUSERS}
        end={{ color: SHOES, size: [0.15, 0.08, 0.26], z: 0.04 }}
      />
      <Limb
        limb={rightLeg}
        x={0.1}
        y={0.66}
        length={0.42}
        radius={0.085}
        color={TROUSERS}
        end={{ color: SHOES, size: [0.15, 0.08, 0.26], z: 0.04 }}
      />
      <mesh position={[0, 0.96, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.28, 8, 16]} />
        <meshStandardMaterial color={SHIRT} roughness={0.7} />
      </mesh>
      <Limb
        limb={leftArm}
        x={-0.27}
        y={1.16}
        length={0.32}
        radius={0.06}
        color={SHIRT}
        end={{ color: SKIN, size: [0.09, 0.09, 0.09], z: 0 }}
      />
      <Limb
        limb={rightArm}
        x={0.27}
        y={1.16}
        length={0.32}
        radius={0.06}
        color={SHIRT}
        end={{ color: SKIN, size: [0.09, 0.09, 0.09], z: 0 }}
      />
      <RoundedBox
        args={[0.36, 0.42, 0.18]}
        radius={0.06}
        position={[0, 1, -0.24]}
        castShadow
      >
        <meshStandardMaterial color={BACKPACK} roughness={0.55} />
      </RoundedBox>
      <group position={[0, 1.46, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 32, 24]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.03, -0.02]} rotation={[-0.35, 0, 0]} castShadow>
          <sphereGeometry args={[0.255, 32, 16, 0, Math.PI * 2, 0, 1.75]} />
          <meshStandardMaterial color={HAIR} roughness={0.9} />
        </mesh>
        {[-0.08, 0.08].map((x) => (
          <mesh key={x} position={[x, -0.01, 0.215]}>
            <sphereGeometry args={[0.03, 12, 8]} />
            <meshStandardMaterial color={HAIR} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const EddieModel = memo(EddieFigure);
