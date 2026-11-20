import { MARKET } from "@eddie-at-bangmod/game";

/** The play frame's width / height. Landscape, so it fills a phone held sideways. */
export const FRAME_ASPECT = 16 / 9;

/** What the fixed camera sees, in Market units. */
export const VIEW_WIDTH = MARKET.bounds.maxX - MARKET.bounds.minX + 0.8;
export const VIEW_HEIGHT = VIEW_WIDTH / FRAME_ASPECT;

/** How far above the floor the camera looks down, in radians (52°). */
export const CAMERA_ELEVATION = (52 * Math.PI) / 180;

/**
 * Where a Market point at a given height lands in the frame, in percent from
 * the frame's top-left corner. Lets the Plop overlay sit on 3D spots. Plain
 * math, so the overlay never pulls three into the server bundle.
 */
export const toFramePercent = (x: number, y: number, height: number) => {
  const up =
    height * Math.cos(CAMERA_ELEVATION) - y * Math.sin(CAMERA_ELEVATION);

  return {
    left: (x / VIEW_WIDTH + 0.5) * 100,
    top: (0.5 - up / VIEW_HEIGHT) * 100,
  };
};
