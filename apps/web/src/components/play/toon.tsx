import { DataTexture, NearestFilter, RedFormat } from "three";

/** Light bands of the toon look: shade, mid and lit. */
const BANDS = [150, 205, 255];

let ramp: DataTexture | undefined;

/** One shared 3-step ramp, so every toon material has the same hard bands. */
const getRamp = () => {
  if (!ramp) {
    ramp = new DataTexture(new Uint8Array(BANDS), BANDS.length, 1, RedFormat);
    ramp.minFilter = NearestFilter;
    ramp.magFilter = NearestFilter;
    ramp.needsUpdate = true;
  }

  return ramp;
};

/** A flat-banded material for the diorama. Pass a Plop color. */
export const Toon = ({ color }: { color: string }) => (
  <meshToonMaterial color={color} gradientMap={getRamp()} />
);
