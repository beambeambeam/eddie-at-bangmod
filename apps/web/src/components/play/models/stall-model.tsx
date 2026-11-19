import type { Stall } from "@eddie-at-bangmod/game";
import { Instance, Instances } from "@react-three/drei";
import { memo } from "react";

import { AWNING_DEPTH, AWNING_HEIGHT, AWNING_OFFSET } from "../stall-looks";
import { ProduceModel } from "./produce-model";
import { VendorModel } from "./vendor-model";

const WOOD = "#6b4a2f";
const WOOD_TOP = "#9a7148";
const CRATE = "#b08455";
const CANVAS = "#f4ecd8";
const STEEL = "#8a8f96";
const BULB = "#ffcf87";

const COUNTER_HEIGHT = 0.72;

/** The counter fills the front of the Stall; the Vendor stands behind it. */
const COUNTER_DEPTH = 0.8;
const STRIPES = 6;
const BULBS = 5;
const SCALLOPS = 8;

const AWNING_TILT = 0.12;
const POLE_RADIUS = 0.025;

/** How far the Vendor stands from the Stall's back edge. */
const VENDOR_INSET = 0.28;

/** Which side of the counter the Vendor stands on, so the sign stays clear. */
const vendorX = (index: number, width: number) =>
  (index % 2 === 0 ? 1 : -1) * width * 0.22;

/** Two stacked crates beside the Vendor, the top one filled with goods. */
const Crates = ({ x, z, tint }: { x: number; z: number; tint: string }) => (
  <group position={[x, 0, z]}>
    {[0, 1].map((level) => (
      <mesh
        key={level}
        position={[level * 0.04, 0.15 + level * 0.3, 0]}
        rotation-y={level * 0.12}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.46, 0.28, 0.34]} />
        <meshStandardMaterial color={CRATE} roughness={0.85} />
      </mesh>
    ))}
    <mesh position={[0.04, 0.6, 0]} rotation-y={0.12}>
      <boxGeometry args={[0.4, 0.04, 0.28]} />
      <meshStandardMaterial color={tint} roughness={0.8} />
    </mesh>
  </group>
);

/** A small steel weighing scale on the counter's corner. */
const Scale = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, COUNTER_HEIGHT + 0.06, z]}>
    <mesh position={[0, 0.06, 0]} castShadow>
      <boxGeometry args={[0.16, 0.12, 0.14]} />
      <meshStandardMaterial color="#d8d4cb" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.07, 0.071]}>
      <circleGeometry args={[0.045, 16]} />
      <meshStandardMaterial color="#f7f3ea" roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.14, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.08, 0.025, 16]} />
      <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
    </mesh>
  </group>
);

/**
 * Model slot `stall`: a wooden counter with a cloth skirt and a steel tray of
 * produce, a Vendor behind it, crates and a striped awning with a scalloped
 * edge and warm bulbs. Centered on the Stall's area, standing on y = 0, the
 * front toward +z. `tint` colors cloth, apron and awning; `index` is the
 * Stall's place in the Market and picks the Vendor.
 */
const StallFigure = ({
  stall,
  index,
  tint,
}: {
  stall: Stall;
  index: number;
  tint: string;
}) => {
  const { area, item } = stall;
  const width = area.maxX - area.minX;
  const depth = area.maxY - area.minY;
  const counterZ = depth / 2 - COUNTER_DEPTH / 2;
  const vendorZ = -depth / 2 + VENDOR_INSET;
  const vendor = vendorX(index, width);
  const span = width + 0.2;
  const stripe = span / STRIPES;
  const poleX = width / 2 - 0.06;

  const poleZ = [
    AWNING_OFFSET - AWNING_DEPTH / 2 + 0.06,
    AWNING_OFFSET + AWNING_DEPTH / 2 - 0.06,
  ];

  return (
    <group
      position={[(area.minX + area.maxX) / 2, 0, (area.minY + area.maxY) / 2]}
    >
      <group position={[0, 0, counterZ]}>
        <mesh position={[0, COUNTER_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, COUNTER_HEIGHT, COUNTER_DEPTH]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.4, COUNTER_DEPTH / 2 + 0.012]} receiveShadow>
          <boxGeometry args={[width - 0.04, 0.56, 0.02]} />
          <meshStandardMaterial color={tint} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.4, COUNTER_DEPTH / 2 + 0.024]}>
          <boxGeometry args={[width - 0.04, 0.05, 0.01]} />
          <meshStandardMaterial color={CANVAS} roughness={0.95} />
        </mesh>
        <mesh position={[0, COUNTER_HEIGHT + 0.03, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + 0.08, 0.06, COUNTER_DEPTH + 0.08]} />
          <meshStandardMaterial color={WOOD_TOP} roughness={0.6} />
        </mesh>
        <mesh position={[0.15, COUNTER_HEIGHT + 0.08, 0.04]} receiveShadow>
          <boxGeometry args={[width - 0.5, 0.04, COUNTER_DEPTH - 0.24]} />
          <meshStandardMaterial
            color={STEEL}
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
        <group position={[0.15, COUNTER_HEIGHT + 0.1, 0.04]}>
          <ProduceModel
            item={item}
            width={width - 0.64}
            depth={COUNTER_DEPTH - 0.36}
          />
        </group>
        <Scale x={-width / 2 + 0.16} z={0} />
      </group>
      <group position={[vendor, 0, vendorZ]}>
        <VendorModel index={index} apron={tint} />
      </group>
      <Crates x={-vendor * 1.75} z={vendorZ - 0.05} tint={tint} />
      {poleZ.flatMap((z) =>
        [-poleX, poleX].map((x) => (
          <mesh key={`${x}:${z}`} position={[x, AWNING_HEIGHT / 2, z]}>
            <cylinderGeometry
              args={[POLE_RADIUS, POLE_RADIUS, AWNING_HEIGHT, 8]}
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
        {Array.from({ length: STRIPES }, (_, stripeIndex) => (
          <mesh
            key={stripeIndex}
            position={[(stripeIndex + 0.5) * stripe - span / 2, 0, 0]}
            castShadow
          >
            <boxGeometry args={[stripe, 0.04, AWNING_DEPTH]} />
            <meshStandardMaterial
              color={stripeIndex % 2 === 0 ? tint : CANVAS}
              roughness={0.9}
            />
          </mesh>
        ))}
        <Instances limit={SCALLOPS}>
          <cylinderGeometry
            args={[
              span / SCALLOPS / 2,
              span / SCALLOPS / 2,
              0.02,
              12,
              1,
              false,
              -Math.PI / 2,
              Math.PI,
            ]}
          />
          <meshStandardMaterial color={tint} roughness={0.9} />
          {Array.from({ length: SCALLOPS }, (_, scallop) => (
            <Instance
              key={scallop}
              position={[
                ((scallop + 0.5) / SCALLOPS - 0.5) * span,
                -0.02,
                AWNING_DEPTH / 2,
              ]}
              rotation-x={Math.PI / 2}
            />
          ))}
        </Instances>
        <Instances limit={BULBS}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial
            color={BULB}
            emissive={BULB}
            emissiveIntensity={6}
            toneMapped={false}
          />
          {Array.from({ length: BULBS }, (_, bulb) => (
            <Instance
              key={bulb}
              position={[
                ((bulb + 0.5) / BULBS - 0.5) * width,
                -0.12,
                AWNING_DEPTH / 2 - 0.04,
              ]}
            />
          ))}
        </Instances>
      </group>
    </group>
  );
};

export const StallModel = memo(StallFigure);
