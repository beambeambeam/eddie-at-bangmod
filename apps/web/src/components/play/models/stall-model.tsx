import type { Stall } from "@eddie-at-bangmod/game";

import type { PlopPalette } from "../plop-colors";
import { itemSlot, signSlot } from "../sprites/slots";
import { Sprite } from "../sprites/sprite";
import { COUNTER_HEIGHT, SIGN_HEIGHT, SIGN_X, SIGN_Z } from "../stall-looks";
import { Toon } from "../toon";

/** x of each piece of goods on the tray, right of the sign. */
const GOODS_X = [-0.05, 0.42, 0.88];

const GOODS_HEIGHT = 0.6;

/** The vendor stands behind the counter, at the back of the Stall. */
const VENDOR_X = 0.4;
const VENDOR_HEIGHT = 1.7;

/**
 * Slot-based Stall: a toon counter with a paper top, three pieces of goods and
 * the sign on the tray, and the Vendor standing behind. Centered on the
 * Stall's area, standing on y = 0, the front toward +z.
 */
export const StallModel = ({
  stall,
  palette,
}: {
  stall: Stall;
  palette: PlopPalette;
}) => {
  const { area, item } = stall;
  const width = area.maxX - area.minX;
  const depth = area.maxY - area.minY;

  return (
    <group
      position={[(area.minX + area.maxX) / 2, 0, (area.minY + area.maxY) / 2]}
    >
      <mesh position={[0, COUNTER_HEIGHT / 2, 0]}>
        <boxGeometry args={[width, COUNTER_HEIGHT, depth]} />
        <Toon color={palette.sheet} />
      </mesh>
      <mesh position={[0, COUNTER_HEIGHT + 0.03, 0]}>
        <boxGeometry args={[width + 0.08, 0.06, depth + 0.08]} />
        <Toon color={palette.paper} />
      </mesh>
      <group position={[VENDOR_X, 0, -depth / 2 + 0.1]}>
        <Sprite
          slot="vendor"
          height={VENDOR_HEIGHT}
          shadow={0.45}
          shadowColor={palette.ink}
        />
      </group>
      {GOODS_X.map((x) => (
        <group key={x} position={[x, COUNTER_HEIGHT + 0.06, 0.2]}>
          <Sprite
            slot={itemSlot(item)}
            height={GOODS_HEIGHT}
            shadow={0.2}
            shadowColor={palette.ink}
          />
        </group>
      ))}
      <group position={[SIGN_X, COUNTER_HEIGHT + 0.06, SIGN_Z]}>
        <Sprite
          slot={signSlot(item)}
          height={SIGN_HEIGHT}
          shadow={0.3}
          shadowColor={palette.ink}
        />
      </group>
    </group>
  );
};
