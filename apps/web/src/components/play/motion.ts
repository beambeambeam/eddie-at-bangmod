import { useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import { Vector3 } from "three";
import type { Object3D } from "three";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);

  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

/** True while the OS asks for reduced motion; follows changes live. */
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

/**
 * Calls `onMove` every frame with the distance `target` covered in world
 * space since the last frame. Models drive wheels and legs from it, so their
 * motion always matches the snapshot.
 */
export const useTravel = (
  target: RefObject<Object3D | null>,
  onMove: (distance: number, delta: number) => void
) => {
  const last = useRef<Vector3 | null>(null);
  const here = useRef(new Vector3());

  useFrame((_, delta) => {
    const object = target.current;

    if (!object) {
      return;
    }

    object.getWorldPosition(here.current);

    const distance = last.current ? last.current.distanceTo(here.current) : 0;

    last.current ??= new Vector3();
    last.current.copy(here.current);

    onMove(distance, delta);
  });
};
