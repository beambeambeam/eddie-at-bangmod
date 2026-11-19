import { CanvasTexture } from "three";

/** A soft round fade, white in the middle and clear at the rim. */
const createFade = () => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (context) {
    const fade = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    fade.addColorStop(0, "rgba(255,255,255,1)");
    fade.addColorStop(0.55, "rgba(255,255,255,0.7)");
    fade.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = fade;
    context.fillRect(0, 0, size, size);
  }

  return new CanvasTexture(canvas);
};

let fade: CanvasTexture | undefined;

/** One fade shared by every blob shadow, so none leaks a texture on unmount. */
const getFade = () => {
  fade ??= createFade();

  return fade;
};

/**
 * The fake shadow under a sprite: a soft disc flat on the floor. The scene has
 * no realtime shadows, so this is the only contact shadow.
 */
export const BlobShadow = ({
  radius,
  color,
  opacity = 0.35,
}: {
  radius: number;
  color: string;
  opacity?: number;
}) => (
  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, 0.02, 0]}
    scale={[radius, radius, 1]}
  >
    <circleGeometry args={[1, 24]} />
    <meshBasicMaterial
      map={getFade()}
      color={color}
      opacity={opacity}
      transparent
      depthWrite={false}
    />
  </mesh>
);
