/** A seeded random generator. Returns floats in [0, 1). */
export type Random = () => number;

const MODULUS = 2_147_483_647;
const MULTIPLIER = 48_271;
const WARM_UP_DRAWS = 3;

/**
 * Lehmer (Park–Miller) generator. Plain arithmetic stays exact in doubles, so every platform draws the same numbers from the same seed.
 */
export const createRandom = (seed: number): Random => {
  let state = (Math.abs(Math.trunc(seed)) % (MODULUS - 1)) + 1;

  const draw = () => {
    state = (state * MULTIPLIER) % MODULUS;

    return (state - 1) / (MODULUS - 1);
  };

  // Small seeds start near 0 and draw almost the same first numbers, so
  // nearby seeds would all deal the same first Shopping List.
  for (let count = 0; count < WARM_UP_DRAWS; count += 1) {
    draw();
  }

  return draw;
};
