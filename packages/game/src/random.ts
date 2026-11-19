/** A seeded random generator. Returns floats in [0, 1). */
export type Random = () => number;

const MODULUS = 2_147_483_647;
const MULTIPLIER = 48_271;

/**
 * Lehmer (Park–Miller) generator. Plain arithmetic stays exact in doubles,
 * so every platform draws the same numbers from the same seed.
 */
export const createRandom = (seed: number): Random => {
  let state = (Math.abs(Math.trunc(seed)) % (MODULUS - 1)) + 1;

  return () => {
    state = (state * MULTIPLIER) % MODULUS;

    return (state - 1) / (MODULUS - 1);
  };
};
