import { OrthographicCamera } from "three";

import { CAMERA_ELEVATION, VIEW_HEIGHT, VIEW_WIDTH } from "./market-view";

const CAMERA_DISTANCE = 15;

/**
 * The fixed orthographic 3/4 camera, looking at the Market's center and
 * framing all of it. Its frustum is set in Market units, so the picture only
 * depends on the frame's aspect, never on its pixel size.
 */
export const createMarketCamera = () => {
  const camera = new OrthographicCamera(
    -VIEW_WIDTH / 2,
    VIEW_WIDTH / 2,
    VIEW_HEIGHT / 2,
    -VIEW_HEIGHT / 2,
    0.1,
    100
  );

  camera.position.set(
    0,
    CAMERA_DISTANCE * Math.sin(CAMERA_ELEVATION),
    CAMERA_DISTANCE * Math.cos(CAMERA_ELEVATION)
  );
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  // `manual` stops R3F from resizing the frustum to the canvas pixels.
  return Object.assign(camera, { manual: true });
};
