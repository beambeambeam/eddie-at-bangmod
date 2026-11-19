import { useLayoutEffect, useRef } from "react";
import { Object3D } from "three";
import type { InstancedMesh } from "three";

const DASH = 0.5;
const DASH_GAP = 0.4;
const EDGES = [-0.45, 0.45];

const marker = new Object3D();

// The mesh lies flat (rotated -90° about x), so an instance's local y is the
// Market's -y and its local z is the height above the floor.

/**
 * Dashed edge lines across the Market along one Motorbike lane, so players see
 * where Motorbikes ride. One instanced mesh, so a lane costs one draw call.
 */
export const MotorbikeLaneModel = ({
  y,
  from,
  to,
  color,
}: {
  y: number;
  from: number;
  to: number;
  color: string;
}) => {
  const dashes = useRef<InstancedMesh>(null);
  const count = Math.floor((to - from) / (DASH + DASH_GAP));

  useLayoutEffect(() => {
    const mesh = dashes.current;

    if (!mesh) {
      return;
    }

    for (const [row, edge] of EDGES.entries()) {
      for (let index = 0; index < count; index += 1) {
        marker.position.set(
          from + DASH / 2 + index * (DASH + DASH_GAP),
          -(y + edge),
          0.006
        );
        marker.updateMatrix();
        mesh.setMatrixAt(row * count + index, marker.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [count, from, y]);

  return (
    <instancedMesh
      ref={dashes}
      args={[undefined, undefined, count * EDGES.length]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[DASH, 0.07]} />
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
};
