import { useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import type { Group } from "three";

import { useReducedMotion } from "../motion";

const SKIN_TONES = ["#c98d63", "#b97a52", "#d9a27a", "#a86c47"];
const HAIR = "#1d1a1c";
const GREY_HAIR = "#9d9a96";
const TROUSERS = "#2f3442";

type Headwear = "bucket-hat" | "cap" | "headscarf" | "bare" | "grey-bun";

interface VendorLook {
  shirt: string;
  headwear: Headwear;
  /** Hat or scarf color; unused when bare. */
  wear: string;
  /** 1 is the default build; a little taller or shorter per Vendor. */
  height: number;
}

/** One look per Stall, in Market order, so neighbors never match. */
const VENDOR_LOOKS: readonly VendorLook[] = [
  { shirt: "#e6dfcf", headwear: "bucket-hat", wear: "#4e6b3c", height: 1 },
  { shirt: "#3f6fa3", headwear: "grey-bun", wear: GREY_HAIR, height: 0.92 },
  { shirt: "#d9774a", headwear: "headscarf", wear: "#c2384a", height: 0.95 },
  { shirt: "#f1efe8", headwear: "cap", wear: "#2c4b7a", height: 1.05 },
  { shirt: "#7a5c99", headwear: "bare", wear: HAIR, height: 0.97 },
  { shirt: "#5a8f6b", headwear: "bucket-hat", wear: "#e0c06a", height: 1.03 },
  { shirt: "#b8433b", headwear: "cap", wear: "#efe7d6", height: 1 },
  { shirt: "#e8c547", headwear: "headscarf", wear: "#3a6f8f", height: 0.94 },
];

/** Breaths per second while the Vendor idles. */
const BREATH_RATE = 0.35;

const Headgear = ({ look }: { look: VendorLook }) => {
  switch (look.headwear) {
    case "bucket-hat": {
      return (
        <group position={[0, 0.12, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.17, 0.2, 0.14, 16]} />
            <meshStandardMaterial color={look.wear} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 20]} />
            <meshStandardMaterial color={look.wear} roughness={0.9} />
          </mesh>
        </group>
      );
    }

    case "cap": {
      return (
        <group position={[0, 0.08, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.215, 16, 8, 0, Math.PI * 2, 0, 1.6]} />
            <meshStandardMaterial color={look.wear} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.24, 0.02, 0.18]} />
            <meshStandardMaterial color={look.wear} roughness={0.7} />
          </mesh>
        </group>
      );
    }

    case "headscarf": {
      return (
        <group>
          <mesh position={[0, 0.04, -0.01]} castShadow>
            <sphereGeometry args={[0.225, 16, 10, 0, Math.PI * 2, 0, 1.9]} />
            <meshStandardMaterial color={look.wear} roughness={0.95} />
          </mesh>
          <mesh position={[0, -0.04, -0.2]} castShadow>
            <coneGeometry args={[0.07, 0.16, 8]} />
            <meshStandardMaterial color={look.wear} roughness={0.95} />
          </mesh>
        </group>
      );
    }

    case "grey-bun": {
      return (
        <group>
          <mesh position={[0, 0.03, -0.02]} castShadow>
            <sphereGeometry args={[0.215, 16, 10, 0, Math.PI * 2, 0, 1.7]} />
            <meshStandardMaterial color={look.wear} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.14, -0.15]} castShadow>
            <sphereGeometry args={[0.08, 12, 10]} />
            <meshStandardMaterial color={look.wear} roughness={0.9} />
          </mesh>
        </group>
      );
    }

    case "bare": {
      return (
        <mesh position={[0, 0.03, -0.02]} castShadow>
          <sphereGeometry args={[0.215, 16, 10, 0, Math.PI * 2, 0, 1.6]} />
          <meshStandardMaterial color={look.wear} roughness={0.9} />
        </mesh>
      );
    }

    default: {
      return null;
    }
  }
};

/**
 * Model slot `vendor`: the person behind a Stall, built from primitives in
 * Eddie's style. `index` is the Stall's place in the Market and picks the
 * look; `apron` takes the Stall's color. It faces +z, stands on y = 0, and
 * only breathes and glances around. It never moves, blocks or reacts to
 * Eddie. With reduced motion it stands still.
 */
const VendorFigure = ({ index, apron }: { index: number; apron: string }) => {
  const look = VENDOR_LOOKS[index % VENDOR_LOOKS.length];
  const skin = SKIN_TONES[index % SKIN_TONES.length];
  const still = useReducedMotion();
  const chest = useRef<Group>(null);
  const head = useRef<Group>(null);
  /** Each Vendor breathes on their own beat. */
  const offset = index * 1.7;

  useFrame(({ clock }) => {
    const time = still ? 0 : clock.elapsedTime * BREATH_RATE * Math.PI * 2;
    const breath = still ? 0 : Math.sin(time + offset);

    chest.current?.scale.set(1 + breath * 0.015, 1 + breath * 0.02, 1);
    head.current?.rotation.set(
      0,
      still ? 0 : Math.sin(time * 0.3 + offset) * 0.45,
      0
    );
  });

  return (
    <group scale={look.height}>
      {[-0.09, 0.09].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.42, 4, 10]} />
          <meshStandardMaterial color={TROUSERS} roughness={0.85} />
        </mesh>
      ))}
      <group ref={chest} position={[0, 0.62, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.26, 8, 16]} />
          <meshStandardMaterial color={look.shirt} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0.17]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.04]} />
          <meshStandardMaterial color={apron} roughness={0.9} />
        </mesh>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.25, 0.38, 0]}
            rotation={[-0.75, 0, side * 0.12]}
          >
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.28, 4, 10]} />
              <meshStandardMaterial color={look.shirt} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.38, 0]} castShadow>
              <sphereGeometry args={[0.055, 10, 8]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={head} position={[0, 1.2, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 24, 18]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0, 0.18]}>
            <sphereGeometry args={[0.025, 10, 8]} />
            <meshStandardMaterial color={HAIR} roughness={0.2} />
          </mesh>
        ))}
        <Headgear look={look} />
      </group>
    </group>
  );
};

export const VendorModel = memo(VendorFigure);
