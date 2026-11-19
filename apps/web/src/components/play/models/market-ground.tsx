import { MARKET } from "@eddie-at-bangmod/game";
import { MeshReflectorMaterial } from "@react-three/drei";

const ASPHALT = "#2b2d33";
const SIDEWALK = "#9a9286";
const CURB = "#b7b2a8";
const LANE = "#e9e4d6";
const SHUTTER = "#6f747b";

const { bounds } = MARKET;
const SIDEWALK_WIDTH = 1.6;
const SIDEWALK_HEIGHT = 0.12;
const CURB_WIDTH = 0.16;

/** Shophouse fronts along the back sidewalk, left to right. */
const SHOPHOUSES = [
  { width: 3.2, color: "#d9c7a7", lit: true },
  { width: 2.8, color: "#b9c4c0", lit: false },
  { width: 3.4, color: "#d8b8a0", lit: true },
  { width: 3, color: "#c9c2b0", lit: false },
];

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
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.85} />
  </mesh>
);

/**
 * Model slot `market-ground`: wet asphalt under the Market, sidewalks and
 * curbs at its edges, shophouses behind and a road in front. `wet` turns on
 * the blurred reflections, which cost a second render of the scene.
 */
export const MarketGround = ({ wet }: { wet: boolean }) => {
  const width = bounds.maxX - bounds.minX;
  const sideX = bounds.maxX + CURB_WIDTH + SIDEWALK_WIDTH / 2;
  const backZ = bounds.minY - CURB_WIDTH - SIDEWALK_WIDTH / 2;
  const wallZ = bounds.minY - CURB_WIDTH - SIDEWALK_WIDTH;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        {wet ? (
          <MeshReflectorMaterial
            color={ASPHALT}
            roughness={0.85}
            metalness={0.35}
            blur={[320, 120]}
            resolution={512}
            mixBlur={1}
            mixStrength={3}
            mirror={0}
            depthScale={1}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
          />
        ) : (
          <meshStandardMaterial
            color={ASPHALT}
            roughness={0.7}
            metalness={0.2}
          />
        )}
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
            color={CURB}
          />
          <Slab
            position={[side * sideX, SIDEWALK_HEIGHT / 2, 0]}
            size={[SIDEWALK_WIDTH, SIDEWALK_HEIGHT, 30]}
            color={SIDEWALK}
          />
        </group>
      ))}
      <Slab
        position={[0, SIDEWALK_HEIGHT / 2 + 0.01, bounds.minY - CURB_WIDTH / 2]}
        size={[width + CURB_WIDTH * 2, SIDEWALK_HEIGHT + 0.02, CURB_WIDTH]}
        color={CURB}
      />
      <Slab
        position={[0, SIDEWALK_HEIGHT / 2, backZ]}
        size={[
          width + (CURB_WIDTH + SIDEWALK_WIDTH) * 2,
          SIDEWALK_HEIGHT,
          SIDEWALK_WIDTH,
        ]}
        color={SIDEWALK}
      />
      <Slab
        position={[0, 0.03, bounds.maxY + CURB_WIDTH / 2]}
        size={[width, 0.06, CURB_WIDTH]}
        color={CURB}
      />
      {Array.from({ length: 6 }, (_, index) => (
        <mesh
          key={index}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[(index - 2.5) * 1.8, 0.005, bounds.maxY + 1.1]}
        >
          <planeGeometry args={[0.9, 0.1]} />
          <meshStandardMaterial color={LANE} roughness={0.6} />
        </mesh>
      ))}
      {SHOPHOUSE_ROW.map(({ width: w, color, lit, x }) => (
        <group key={x} position={[x, 0, wallZ - 0.3]}>
          <Slab
            position={[0, 2.5, 0]}
            size={[w - 0.05, 5, 0.6]}
            color={color}
          />
          <mesh position={[0, 1.2, 0.31]}>
            <boxGeometry args={[w - 0.5, 2.2, 0.04]} />
            {lit ? (
              <meshStandardMaterial
                color="#ffd49a"
                emissive="#ffb35c"
                emissiveIntensity={1.6}
              />
            ) : (
              <meshStandardMaterial
                color={SHUTTER}
                metalness={0.6}
                roughness={0.45}
              />
            )}
          </mesh>
        </group>
      ))}
    </group>
  );
};
