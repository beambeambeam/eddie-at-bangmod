import { useTexture } from "@react-three/drei";
import { createContext, use, useMemo } from "react";
import type { ReactNode } from "react";
import type { Texture } from "three";

import { SPRITE_SLOTS, spriteUrl } from "./slots";
import type { SpriteSlot } from "./slots";

/** A loaded sprite and its width / height, read from the art itself. */
interface LoadedSprite {
  texture: Texture;
  aspect: number;
}

const TexturesContext = createContext<ReadonlyMap<
  SpriteSlot,
  LoadedSprite
> | null>(null);

const aspectOf = ({ image }: Texture): number => {
  if (!(image instanceof HTMLImageElement)) {
    throw new TypeError("A sprite texture is not an image.");
  }

  return image.naturalWidth / image.naturalHeight;
};

/** Sharper art at a slant, set once as each texture loads. */
const sharpen = (textures: Texture | Texture[]) => {
  for (const texture of [textures].flat()) {
    texture.anisotropy = 4;
  }
};

/**
 * Loads every sprite texture before the Market draws. Slots swap often (Eddie
 * turns, Items vanish), so a slot's texture is always ready and never
 * suspends mid-Run. Suspends once, on mount.
 */
export const SpriteTexturesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const loaded = useTexture(SPRITE_SLOTS.map(spriteUrl), sharpen);

  const sprites = useMemo(() => {
    const map = new Map<SpriteSlot, LoadedSprite>();

    for (const [index, slot] of SPRITE_SLOTS.entries()) {
      const texture = loaded[index];

      if (texture === undefined) {
        throw new Error(`Sprite slot "${slot}" did not load.`);
      }

      map.set(slot, { texture, aspect: aspectOf(texture) });
    }

    return map;
  }, [loaded]);

  return <TexturesContext value={sprites}>{children}</TexturesContext>;
};

export const useSprite = (slot: SpriteSlot): LoadedSprite => {
  const sprites = use(TexturesContext);
  const sprite = sprites?.get(slot);

  if (sprite === undefined) {
    throw new Error(`Sprite slot "${slot}" is not loaded.`);
  }

  return sprite;
};
