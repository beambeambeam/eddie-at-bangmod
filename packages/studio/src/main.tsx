import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { createRoot } from "react-dom/client";

import { createShotCamera, MarketSprint } from "./market-sprint";

// Give the instanced stall details and reflections time to populate.
const WARM_UP_FRAMES = 4;

const RenderReady = () => {
  const frames = useRef(WARM_UP_FRAMES);

  useFrame(({ gl, invalidate }) => {
    frames.current -= 1;

    if (frames.current > 0) {
      invalidate();
    } else {
      gl.domElement.dataset.ready = "true";
    }
  }, 2);

  return null;
};

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Studio canvas root is missing.");
}

createRoot(root).render(
  <Canvas
    camera={createShotCamera()}
    dpr={1}
    frameloop="demand"
    gl={{ antialias: true, preserveDrawingBuffer: true }}
    shadows="percentage"
  >
    <MarketSprint />
    <RenderReady />
  </Canvas>
);
