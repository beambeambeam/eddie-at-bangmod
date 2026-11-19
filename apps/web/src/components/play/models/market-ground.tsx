import { MARKET } from "@eddie-at-bangmod/game";

import type { PlopPalette } from "../plop-colors";
import { Toon } from "../toon";

const { bounds } = MARKET;
const SIDEWALK_WIDTH = 1.6;
const SIDEWALK_HEIGHT = 0.12;
const CURB_WIDTH = 0.16;

/** Shophouse fronts along the back sidewalk, left to right. */
const SHOPHOUSES = [
  { width: 3.2, tone: "mint" },
  { width: 2.8, tone: "bubblegum" },
  { width: 3.4, tone: "mustard" },
  { width: 3, tone: "periwinkle" },
] as const;

const ROW_WIDTH = SHOPHOUSES.reduce((sum, { width }) => sum + width, 0);

/** Each shophouse with the x of its center, packed edge to edge. */
const SHOPHOUSE_ROW = SHOPHOUSES.map((shophouse, index) => ({
  ...shophouse,
  x:
    -ROW_WIDTH / 2 +
    SHOPHOUSES.slice(0, index).reduce((sum, { width }) => sum + width, 0) +
    shophouse.width / 2,
}));

const Slab = ({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <Toon color={color} />
  </mesh>
);

/**
 * Slot-based ground: a paper-toned floor under the Market, sidewalks and curbs
 * at its edges, shophouses behind and a road in front. Low-poly boxes with
 * toon materials in Plop colors.
 */
export const MarketGround = ({ palette }: { palette: PlopPalette }) => {
  const width = bounds.maxX - bounds.minX;
  const sideX = bounds.maxX + CURB_WIDTH + SIDEWALK_WIDTH / 2;
  const backZ = bounds.minY - CURB_WIDTH - SIDEWALK_WIDTH / 2;
  const wallZ = bounds.minY - CURB_WIDTH - SIDEWALK_WIDTH;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <Toon color={palette.track} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab
            position={[
              side * (bounds.maxX + CURB_WIDTH / 2),
              SIDEWALK_HEIGHT / 2 + 0.01,
              0,
            ]}
            size={[CURB_WIDTH, SIDEWALK_HEIGHT + 0.02, 30]}
            color={palette.periwinkle}
          />
          <Slab
            position={[side * sideX, SIDEWALK_HEIGHT / 2, 0]}
            size={[SIDEWALK_WIDTH, SIDEWALK_HEIGHT, 30]}
            color={palette.sheet}
          />
        </group>
      ))}
      <Slab
        position={[0, SIDEWALK_HEIGHT / 2 + 0.01, bounds.minY - CURB_WIDTH / 2]}
        size={[width + CURB_WIDTH * 2, SIDEWALK_HEIGHT + 0.02, CURB_WIDTH]}
        color={palette.periwinkle}
      />
      <Slab
        position={[0, SIDEWALK_HEIGHT / 2, backZ]}
        size={[
          width + (CURB_WIDTH + SIDEWALK_WIDTH) * 2,
          SIDEWALK_HEIGHT,
          SIDEWALK_WIDTH,
        ]}
        color={palette.sheet}
      />
      <Slab
        position={[0, 0.03, bounds.maxY + CURB_WIDTH / 2]}
        size={[width, 0.06, CURB_WIDTH]}
        color={palette.periwinkle}
      />
      {Array.from({ length: 6 }, (_, index) => (
        <Slab
          key={index}
          position={[(index - 2.5) * 1.8, 0.005, bounds.maxY + 1.1]}
          size={[0.9, 0.01, 0.1]}
          color={palette.paper}
        />
      ))}
      {SHOPHOUSE_ROW.map(({ width: w, tone, x }) => (
        <group key={x} position={[x, 0, wallZ - 0.3]}>
          <Slab
            position={[0, 2.5, 0]}
            size={[w - 0.05, 5, 0.6]}
            color={palette[tone]}
          />
          <Slab
            position={[0, 1.2, 0.31]}
            size={[w - 0.5, 2.2, 0.04]}
            color={palette["ink-soft"]}
          />
          <Slab
            position={[0, 3.4, 0.31]}
            size={[w - 1.2, 0.9, 0.04]}
            color={palette.paper}
          />
        </group>
      ))}
    </group>
  );
};
