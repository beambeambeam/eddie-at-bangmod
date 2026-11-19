import type { Ref } from "react";
import { DoubleSide } from "three";
import type { Group } from "three";

import { CAMERA_ELEVATION } from "../market-view";
import { BlobShadow } from "./blob-shadow";
import type { SpriteSlot } from "./slots";
import { useSprite } from "./sprite-textures";

/** A vertical plane shows only this share of its height to the tilted camera. */
const FORESHORTEN = Math.cos(CAMERA_ELEVATION);

interface SpriteProps {
  slot: SpriteSlot;
  /** How tall the sprite looks on screen, in Market units. Width follows the art. */
  height: number;
  /** Radius of the blob shadow on the floor; none when it is 0. */
  shadow?: number;
  /** Tint of the blob shadow. */
  shadowColor: string;
  /** Mirrors the art, for art drawn facing right. */
  flip?: boolean;
  /** The cutout alone, without its shadow, so a caller can bob it. */
  bodyRef?: Ref<Group>;
}

/**
 * A paper-cutout billboard standing on the floor at the group's origin. It
 * stands upright, so it is stretched to cancel the camera's foreshortening and
 * to keep the art's proportions on screen. Size comes from the slot's texture,
 * so a replaced file of another aspect still fits.
 */
export const Sprite = ({
  slot,
  height,
  shadow = 0,
  shadowColor,
  flip = false,
  bodyRef,
}: SpriteProps) => {
  const { texture, aspect } = useSprite(slot);

  const width = height * aspect;
  const stretched = height / FORESHORTEN;

  return (
    <group>
      {shadow > 0 && <BlobShadow radius={shadow} color={shadowColor} />}
      <group ref={bodyRef}>
        <mesh position={[0, stretched / 2, 0]} scale-x={flip ? -1 : 1}>
          <planeGeometry args={[width, stretched]} />
          <meshBasicMaterial
            map={texture}
            alphaTest={0.4}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};
