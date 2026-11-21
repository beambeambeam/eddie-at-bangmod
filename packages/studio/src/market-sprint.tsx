import { MARKET } from "@eddie-at-bangmod/game";
import type { Item } from "@eddie-at-bangmod/game";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  SMAA as Smaa,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  PerspectiveCamera,
} from "three";
import { EddieModel, MarketGround, StallModel } from "web/market-art";
import type { EddiePose } from "web/market-art";

import { SHOT } from "./shot";

const sprint: EddiePose = {
  head: [-0.1, 0.38, -0.08],
  leftArm: [-1.32, -0.06, 0.18],
  rightArm: [1.24, -0.12, -0.25],
  leftLeg: [0.79, 0, 0.08],
  rightLeg: [-0.99, 0, -0.16],
};

const stallColors: Record<Item, string> = {
  basil: "#59a682",
  chili: "#e6382d",
  egg: "#eab85c",
  "fish-sauce": "#eab85c",
  garlic: "#7c8cce",
  lime: "#59a682",
  pork: "#db7295",
  rice: "#7c8cce",
};

// The fabric flares away from the awning as it tapers.
const awningDrape = new BufferGeometry();

awningDrape.setAttribute(
  "position",
  new Float32BufferAttribute(
    [
      0, 0, 0, 0.61, 0, 0, 0.61, -0.24, 0.01, 0.4, -0.39, 0.06, 0.08, -0.91,
      0.12,
    ],
    3
  )
);

awningDrape.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);

awningDrape.computeVertexNormals();

export const createShotCamera = () => {
  const camera = new PerspectiveCamera(32, SHOT.width / SHOT.height, 0.05, 70);
  camera.position.set(1.95, 1.28, 4.55);
  camera.lookAt(-0.75, 0.93, -0.4);
  camera.rotateZ(-0.15);

  return camera;
};

export const MarketSprint = () => (
  <>
    <color attach="background" args={["#384969"]} />
    <fog attach="fog" args={["#41587f", 4.5, 16]} />
    <hemisphereLight args={["#98b8fb", "#876364", 1.5]} />
    <directionalLight
      position={[-3, 6, 2]}
      color="#ffd2a1"
      intensity={3.1}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-7}
      shadow-camera-right={7}
      shadow-camera-top={7}
      shadow-camera-bottom={-7}
      shadow-camera-far={24}
      shadow-normalBias={0.02}
    />
    <directionalLight position={[1, 2, 5]} color="#c9dfff" intensity={1.05} />
    <pointLight position={[2.1, 2.2, 0]} color="#61aaff" intensity={27} />
    <pointLight position={[-1.57, 1.71, 1.47]} color="#ffc07a" intensity={7} />
    <MarketGround wet />
    {MARKET.stalls.map((stall, index) => {
      if (stall.area.minY < 0) {
        return (
          <StallModel
            key={stall.item}
            stall={stall}
            index={index}
            tint={stallColors[stall.item]}
          />
        );
      }

      if (stall.item === "chili") {
        return (
          <group key={stall.item} position={[4.14, -0.13, 0.37]}>
            <StallModel stall={stall} index={index} tint={stallColors.chili} />
            <mesh
              geometry={awningDrape}
              position={[stall.area.maxX + 0.095, 1.98, 1.68]}
              rotation-y={Math.PI / 2}
            >
              <meshStandardMaterial
                color={stallColors.chili}
                roughness={0.88}
                side={DoubleSide}
              />
            </mesh>
          </group>
        );
      }

      return null;
    })}
    <group position={[1.2, 0.03, 1.38]} rotation-y={-0.82}>
      <group rotation-x={0.29} rotation-z={0.12}>
        <EddieModel pose={sprint} />
      </group>
    </group>
    <EffectComposer multisampling={0}>
      <DepthOfField
        target={[1.04, 1.3, 1.7]}
        worldFocusRange={2.1}
        bokehScale={3}
      />
      <Bloom mipmapBlur luminanceThreshold={1.15} intensity={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.44} />
      <Smaa />
    </EffectComposer>
  </>
);
